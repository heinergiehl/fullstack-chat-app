type ChatCreatedPayload = {
  chat: Chat
  notification: Notification
}

export const useUseRealtimeChats = () => {
  const queryClient = useQueryClient()
  const { $socket: socket } = useNuxtApp()

  onMounted(() => {
    socket.on("chatCreated", (payload: ChatCreatedPayload) => {
      const { notification, chat } = payload

      console.log("Chat created: ", chat)
      queryClient.setQueryData<Notification[]>(
        ["notifications"],
        (oldData = []) => {
          return [notification, ...oldData]
        }
      )

      const chatWithNewNotifcations = {
        ...chat,
        notifications: [notification],
      }
      console.log("CHATCREATED69", chatWithNewNotifcations)
      queryClient.setQueryData<Chat[]>(["chats"], (oldData = []) => {
        return [...oldData, chatWithNewNotifcations]
      })
    })
    socket.on("chatDeleted", (payload: { chatId: number }) => {
      const { chatId } = payload
      console.log("Chat deleted: ", chatId)
      queryClient.setQueryData<Chat[]>(["chats"], (oldData = []) => {
        return oldData.filter((chat) => chat.id !== chatId)
      })
      if (chatId === Number(useRoute().params.id)) {
        navigateTo("/")
      }
    })
  })

  onBeforeUnmount(() => {
    socket.off("chatCreated")
  })
}
