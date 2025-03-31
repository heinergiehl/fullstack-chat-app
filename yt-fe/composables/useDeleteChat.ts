export const useDeleteChat = () => {
  const queryClient = useQueryClient()
  const { callApi } = useApi()

  return useMutation({
    mutationFn: async (chatId: number) => {
      await callApi<{ message: string }>(`/chats/${chatId}`, {
        method: "DELETE",
        credentials: "include",
      })
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] })
    },
  })
}
