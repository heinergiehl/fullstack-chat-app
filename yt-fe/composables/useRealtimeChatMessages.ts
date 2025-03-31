export interface RealtimeNotificationPayload {
  message: ChatMessage
}

export const useUseRealtimeChatMessages = () => {
  const queryClient = useQueryClient()
  const { $socket: socket } = useNuxtApp()
  onMounted(() => {
    socket.on("chatMessageReceived", (payload: RealtimeNotificationPayload) => {
      const newMessage = payload.message
      if (!newMessage) return
      const chatId = newMessage.chatId
      // for video important!!!
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      const cachedChat = queryClient.getQueryData<Chat>(["chat", chatId])

      if (!cachedChat?.messages) return

      const newMessages = [...cachedChat.messages, newMessage]
      queryClient.setQueryData<Chat>(["chat", chatId], {
        ...cachedChat,
        messages: newMessages,
        lastMessageId: newMessage.id,
        lastMessage: newMessage,
      })
    })

    onBeforeUnmount(() => {
      socket.off("chatMessageReceived")
    })
  })
}
