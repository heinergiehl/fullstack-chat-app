import type { RouteRecordNameGeneric } from "vue-router"

export interface LoginPayload {
  email: string
  password: string
}

export const useLoginUser = (route: RouteRecordNameGeneric) => {
  const { callApi } = useApi()
  const router = useRouter()
  const toast = useToast()

  return useMutation({
    mutationFn: async (variables: LoginPayload) => {
      await callApi<{ message: string }>("/login", {
        method: "POST",
        body: variables,
        credentials: "include",
      })
    },
    onError: (error: any) => {
      console.log(error.response, error.response._data)
      toast.add({
        title: "Error",
        description: error.response._data.message,
        color: "error",
        icon: "i-heroicons-information-circle",
      })
    },
    onSuccess: async () => {
      router.push("/")
    },
  })
}
