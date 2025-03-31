import { defineStore } from "pinia"

export const usePresenceStore = defineStore("presence", {
  state: () => ({
    onlineUsers: [] as User[],
    initialized: false,
  }),
  actions: {
    initializePresence() {
      if (this.initialized) return
      if (import.meta.server) return

      const nuxtApp = useNuxtApp()
      const socket = nuxtApp.$socket
      if (!socket) {
        console.log("Socket not available in presence store.")
        return
      }

      const userProfileQuery = useUserProfile()

      if (socket.disconnected) {
        console.log("Socket is disconnected. Connecting ...")
        socket.connect()
      }

      socket.on("connect", () => {
        console.log("Socket connected with id: ", socket.id)
        const user = userProfileQuery.data?.value?.user
        if (user) {
          this.joinRoom(user)
        }
      })
      const queryClient = useQueryClient()
      socket.on("presenceUpdate", (onlineUsers: User[]) => {
        console.log("Presence Store, received presenceUpdate: ", onlineUsers)
        //  Update the online status of friends in the cache.
        this.onlineUsers = onlineUsers
        queryClient.invalidateQueries({ queryKey: ["friends"] })
      })

      watch(
        () => userProfileQuery.data.value,
        (newData) => {
          if (newData?.user) {
            if (socket.disconnected) {
              console.log("Socket is disconnected. Connecting ...")
              socket.connect()
            }
            this.joinRoom(newData.user)
          }
        },
        { immediate: true }
      )
      this.initialized = true
    },

    joinRoom(user: User) {
      const nuxtApp = useNuxtApp()

      const socket = nuxtApp.$socket
      if (user && socket && socket.connected) {
        console.log("Joining room: ", user.id)
        socket.emit("joinRoom", { id: user.id })
      } else {
        console.log("Socket not available in presence store.")
      }
    },

    leaveRoom(user: User) {
      const nuxtApp = useNuxtApp()

      const socket = nuxtApp.$socket
      if (user && socket && socket.connected) {
        console.log("Leaving room: ", user.id)
        socket.emit("leaveRoom", { id: user.id })
      } else {
        console.log("Socket not available in presence store.")
      }
    },
    cleanUpPresence() {
      if (import.meta.server) return

      const nuxtApp = useNuxtApp()
      const socket = nuxtApp.$socket
      if (socket) {
        socket.off("presenceUpdate")
        socket.off("connect")
      }
      this.initialized = false
      this.onlineUsers = []
    },
    updateOnlineUser(userId: number, chatId: number) {
      const userIndex = this.onlineUsers.findIndex((user) => user.id === userId)
      if (userIndex !== -1) {
        this.onlineUsers[userIndex].chatId = chatId
      } else {
        console.log("User not found in online users list.")
      }
    },
  },
})
