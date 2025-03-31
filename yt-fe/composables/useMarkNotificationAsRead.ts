export const useMarkNotificationAsRead = () => {
  const { callApi } = useApi()

  return useMutation({
    mutationFn: async (id: number) => {
      return await callApi<{ message: string }>(`/notifications/${id}/read`, {
        method: "PUT",
        credentials: "include",
      })
    },
  })
}
