export const useLogoutUser = () => {
  const { callApi } = useApi()
  const router = useRouter()
  const queryClient = useQueryClient()
  const toast = useToast()
  const { $socket: socket } = useNuxtApp()
  const { params } = useRoute()
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
    onSuccess: async () => {
      queryClient.clear()
    },
  })
}
