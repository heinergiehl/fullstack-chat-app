import type { RouteRecordNameGeneric } from "vue-router"

export interface UserResponse {
  message: string
  user: User
}

export const useUserProfile = (routeName: RouteRecordNameGeneric) => {
  const { callApi } = useApi()

  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () =>
      await callApi<UserResponse>("/profile", {
        method: "GET",
        credentials: "include",
      }),
    retry: 1,
    enabled: routeName !== "login" && routeName !== "register",
  })
}
