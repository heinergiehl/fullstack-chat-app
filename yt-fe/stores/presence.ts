// In your Pinia store (e.g., presence store)
export const usePresenceStore = defineStore("presence", {
  state: () => ({
    onlineUsers: [] as User[], // All users, with chatId info if applicable
    initialized: false,
  }),
  getters: {
    lobbyUsers: (state) => state.onlineUsers.filter((user) => !user.chatId),
    // You can also have a getter that takes chatId as parameter if needed
    chatUsers: (state) => {
      return (chatId: number) =>
        state.onlineUsers.filter((user) => user.chatId === chatId)
    },
  },
  actions: {
    initializePresence() {
      if (this.initialized) return
      if (import.meta.server) return

      const nuxtApp = useNuxtApp()
      const socket = nuxtApp.$socket
      const queryClient = useQueryClient()

      socket.on("presenceUpdate", (onlineUsers: User[]) => {
        this.onlineUsers = onlineUsers
        queryClient.invalidateQueries({ queryKey: ["friends"] })
      })

      this.initialized = true
    },
    cleanUpPresence() {
      if (import.meta.server) return
      const nuxtApp = useNuxtApp()
      const socket = nuxtApp.$socket
      socket?.off("presenceUpdate")
      this.initialized = false
      this.onlineUsers = []
    },
  },
})
