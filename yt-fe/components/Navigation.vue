<script lang="ts" setup>
  const colorMode = useColorMode()
  const routeName = useRoute().name
  const userProfileQuery = useUserProfile(routeName)

  const logoutMutation = useLogoutUser()

  const isDark = computed({
    get() {
      return colorMode.value === "dark"
    },

    set() {
      colorMode.preference = colorMode.value === "dark" ? "light" : "dark"
      console.log("setDarkMode", colorMode.value)
    },
  })
  const presenceStore = usePresenceStore()
  const links = computed(() => {
    const baseLinks = [
      {
        labe: "Home",
        icon: "i-heroicons-chat-bubble-left-ellipsis",
        to: "/",
      },
      {
        slot: "darkMode",
      },
    ]

    const authUser = userProfileQuery.data.value?.user

    const socket = useNuxtApp().$socket
    const params = useRoute().params

    const authLinks = authUser
      ? [
          {
            label: authUser.name,
            avatar: {
              src: getAvatarUrl(authUser),
            },
            to: "/profile",
          },
          {
            label: "Logout",
            slot: "logout",

            onSelect: async () => {
              // socket.emit("leaveChat", {
              //   chatId: params.id,
              // })
              socket.emit("logout", () => {
                socket.disconnect()
              })
              await logoutMutation.mutateAsync()
              navigateTo("/login")
            },
          },
        ]
      : [
          {
            label: "Login",
            icon: "i-heroicons-arrow-left-start-on-rectangle",
            to: "/login",
          },
        ]

    return [baseLinks, authLinks]
  })
</script>

<template>
  <UNavigationMenu
    class="border-b border-gray-200 dark:border-gray-800"
    orientation="horizontal"
    :items="links"
  >
    <template #darkMode-label>
      <UButton
        class="p-0"
        variant="link"
        :icon="
          isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'
        "
        @click="isDark = !isDark"
      />
    </template>
  </UNavigationMenu>
</template>
