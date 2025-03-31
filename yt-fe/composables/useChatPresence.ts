export const useChatPresence = () => {
  const socket = useNuxtApp().$socket
  const onlineUsersInChat = ref<MinimalUser[]>([])
  onMounted(() => {
    socket.on("chatPresenceUpdate", (onlineUsers: MinimalUser[]) => {
      console.log("Chat Presence Update: ", onlineUsers)
      onlineUsersInChat.value = onlineUsers
    })
  })

  onBeforeUnmount(() => {
    socket.off("chatPresenceUpdate")
  })

  return {
    onlineUsersInChat,
  }
}
