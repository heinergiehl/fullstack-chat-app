export const useLogoutUser = () => {
  const { callApi } = useApi()
  const router = useRouter()
  const queryClient = useQueryClient()
  const toast = useToast()
  const { $socket: socket } = useNuxtApp()
  return useMutation({
    mutationFn: async () => {
      await callApi<{ message: string }>("/logout", {
        method: "POST",
        credentials: "include",
      })
    },
    onError: (error: any) => {
      toast.add({
        title: "Error",
        description: error.response._data.message,
        color: "error",
        icon: "i-heroicons-information-circle",
      })
    },
    onSuccess: () => {
      queryClient.setQueryData(["userProfile"], null)
      queryClient.setQueryData(["notifications"], null)
      queryClient.setQueryData(["friends"], null)
      queryClient.setQueryData(["friendRequests"], null)
      queryClient.setQueryData(["chats"], null)

      socket.emit("leaveRoom", {})
      socket.disconnect()
      router.push("/login")
    },
  })
}
