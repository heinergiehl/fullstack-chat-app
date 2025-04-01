export interface TypingIndicator {
  name: string
  userId: number
  isTyping: boolean
}
export type MinimalUser = {
  name: string
  id: number
  profile_image: string
  chatId?: number
}
export const useSetupChatRoom = (chatId: number) => {
  const typingIndicators = ref<TypingIndicator[]>([])
  const { $socket: socket } = useNuxtApp()

  const joinChat = () => {
    socket.emit("joinChat", { chatId })
  }
  const route = useRoute()
  const leaveChat = () => {
    console.log("Leaving chat: ", chatId)
    socket.emit("leaveChat", { chatId })
  }
  const currentOnlineUsersInChat = ref<MinimalUser[]>([])

  const onTypingIndicator = (payload: TypingIndicator) => {
    console.log("Typing indicator received: ", payload)
    const idx = typingIndicators.value.findIndex(
      (ti) => ti.userId === payload.userId
    )

    if (payload.isTyping) {
      if (idx === -1) {
        typingIndicators.value.push(payload)
      } else {
        typingIndicators.value[idx] = payload
      }
    } else {
      if (idx !== -1) {
        typingIndicators.value.splice(idx, 1)
      }
    }
  }

  const toast = useToast()
  const config = useRuntimeConfig()

  const queryClient = useQueryClient()
  const onUserJoined = (payload: {
    userId: number
    name: string
    profile_image: string
  }) => {
    const friends = queryClient.getQueryData<Friend[]>(["friends"])
    const friend = friends?.find((friend: User) => friend.id === payload.userId)
    if (!friend) return

    toast.add({
      description: `${payload.name} joined the chat`,
      title: "User joined",
      avatar: {
        src: getAvatarUrl(friend),
        alt: payload.name,
      },
      color: "success",
      duration: 2000,
    })
  }

  const onUserLeft = (payload: {
    userId: number
    name: string
    profile_image: string
  }) => {
    console.log("User left: ", payload)

    const friends = queryClient.getQueryData<Friend[]>(["friends"])
    const friend = friends?.find((friend: User) => friend.id === payload.userId)
    if (!friend) return
    toast.add({
      title: "User left",
      avatar: {
        src: getAvatarUrl(friend),

        alt: payload.name,
      },
      color: "error",
      description: `${payload.name} left the chat`,
      duration: 2000,
    })
  }

  onMounted(() => {
    socket.on("userLeft", onUserLeft)
    joinChat()
    socket.on("typingIndicator", onTypingIndicator)
    socket.on("userJoined", onUserJoined)
  })
  onBeforeUnmount(async () => {
    console.log("Unmounting typing indicator")
    leaveChat()
    await nextTick()
    socket.off("typingIndicator", onTypingIndicator)
    socket.off("userJoined", onUserJoined)
    socket.off("userLeft", onUserLeft)
  })
  const emitTyping = (isTyping: boolean) => {
    socket.emit("typing", { chatId, isTyping })
  }

  return { typingIndicators, emitTyping, currentOnlineUsersInChat }
}
