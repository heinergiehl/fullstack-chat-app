export const useUseRealtimeFriends = () => {
  const queryClient = useQueryClient()
  const { $socket: socket } = useNuxtApp()

  onMounted(() => {
    socket.on("newFriendAdded", (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ["friends"] })
    })
  })

  onBeforeUnmount(() => {
    socket.off("newFriendAdded")
  })
}
