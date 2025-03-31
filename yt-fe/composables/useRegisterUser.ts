export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export const useRegisterUser = () => {
  const { callApi } = useApi()
  const router = useRouter()
  const toast = useToast()
  const { refetch } = useUserProfile()
  return useMutation({
    mutationFn: async (variables: RegisterPayload) => {
      return await callApi<{ message: string }>("/register", {
        method: "POST",
        body: variables,
        credentials: "include",
      })
    },
    onError: (error: any) => {
      console.log("useRegisterUser,", error.response._data)
      toast.add({
        title: "Error",
        description: error.response._data.message,
        color: "error",
        icon: "i-heroicons-information-circle",
      })
    },
    onSuccess: async (data) => {
      await refetch()
      router.push("/")
    },
  })
}
