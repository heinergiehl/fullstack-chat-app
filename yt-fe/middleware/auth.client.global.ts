export default defineNuxtRouteMiddleware(async (to, from) => {
  if (import.meta.server) return

  const { refetch, data } = useUserProfile()
  await refetch()

  if (
    data.value === undefined &&
    to.path !== "/login" &&
    to.path !== "/register"
  ) {
    return navigateTo("/login")
  }
})
