type RealtimeNotificationPayload = {
  friendRequest?: FriendRequest
  notification?: Notification
  message?: string
}

export const useRealtimeFriendRequests = () => {
  const queryClient = useQueryClient()
  const { $socket: socket } = useNuxtApp()

  onMounted(() => {
    socket.on(
      "friendRequestReceived",
      (payload: RealtimeNotificationPayload) => {
        queryClient.setQueryData<Notification[]>(
          ["notifications"],
          (oldData = []) => {
            if (!payload.notification) return oldData
            return [payload.notification, ...oldData]
          }
        )
      }
    )

    socket.on(
      "friendRequestAccepted",
      (payload: RealtimeNotificationPayload) => {
        queryClient.setQueryData<Notification[]>(
          ["notifications"],
          (oldData = []) => {
            console.log("friendRequestAccepted: ", payload.notification)
            if (!payload.notification) return oldData
            return [payload.notification, ...oldData]
          }
        )
      }
    )
  })

  onBeforeUnmount(() => {
    socket.off("friendRequestReceived")
    socket.off("friendRequestAccepted")
  })
}
