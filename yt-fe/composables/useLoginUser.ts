export interface LoginPayload {
  email: string
  password: string
}

export const useLoginUser = () => {
  const { callApi } = useApi()
  const router = useRouter()
  const toast = useToast()

  const { refetch } = useUserProfile()

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
      await refetch()
      router.push("/")
    },
  })
}
