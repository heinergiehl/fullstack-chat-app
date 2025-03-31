export interface UserResponse {
  message: string
  user: User
}

export const useUserProfile = () => {
  const { callApi } = useApi()

  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () =>
      await callApi<UserResponse>("/profile", {
        method: "GET",
        credentials: "include",
      }),
    retry: 1,
  })
}
