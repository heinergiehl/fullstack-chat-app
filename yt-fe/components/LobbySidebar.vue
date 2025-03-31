<script lang="ts" setup>
  const presenceStore = usePresenceStore()
  const { onlineUsers: users } = storeToRefs(presenceStore)

  const userProfileQuery = useUserProfile()
  const { friends } = useFriendList()

  const nonFriendOnlineUsers = computed<User[]>(() => {
    const currentUserId = userProfileQuery.data.value?.user?.id
    if (!currentUserId) return []

    const friendIds = friends.value.map((f) => f.id)

    return users.value.filter(
      (u) => u.id !== currentUserId && !friendIds.includes(u.id)
    )
  })
  // const mutation = useCreateFriendRequest()
  const queryClient = useQueryClient()
  const toast = useToast()

  type FriendRequestPayload = {
    receiverId: number
  }

  type FriendRequestResponse = {
    message: string
    friendRequest: FriendRequest
  }
  const { callApi } = useApi()
  const createFriendRequestMutation = useMutation({
    mutationFn: async (payload: FriendRequestPayload) => {
      const { receiverId } = payload
      await callApi<FriendRequestResponse>("/friend-request", {
        method: "POST",
        body: { receiverId },
        credentials: "include",
      })
    },
  })

  function requestFriendship(receiver: User) {
    createFriendRequestMutation.mutate(
      { receiverId: receiver.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["notifications"] })
        },

        onError: (error: any) => {
          toast.add({
            color: "error",
            title: "Error",
            description: error.response._data.error,
            icon: "i-heroicons-information-circle",
          })
        },
      }
    )
  }

  function getDropdownItems(user: User) {
    return [
      [
        {
          label: "Send Friend Request",
          icon: "i-heroicons-user-plus",
          slot: "friend-request",
          onSelect: () => requestFriendship(user),
        },
      ],
    ]
  }
  const config = useRuntimeConfig()
  const backendBaseUrl = config.public.BACKEND_BASE_URL
</script>

<template>
  <div class="dark:bg-gray-900 bg-gray-100 lg:flex hidden">
    <USeparator orientation="vertical" />
    <div class="flex flex-col h-[calc(100vh-60px)] p-2">
      <div class="flex items-center space-x-2 w[200px] text-gray-400">
        <UIcon name="i-heroicons-user-group" size="20" />
        <h2 class="text-lg font-bold">User Lobby</h2>
      </div>

      <div
        v-if="nonFriendOnlineUsers.length === 0"
        class="text-gray-500 text-xs"
      >
        No non-friend online users
      </div>
      <div
        class="mb-2 flex items-center justify-between"
        v-for="user in nonFriendOnlineUsers"
        :key="user.id"
        v-else
      >
        <UDropdownMenu
          :content="{
            align: 'start',
            side: 'bottom',
            sideOffset: 0,
          }"
          :items="getDropdownItems(user)"
        >
          <UButton class="flex items-center cursor-pointer" variant="ghost">
            <UAvatar :src="getAvatarUrl(user)" />
            <span class="ml-2">{{ user.name }}</span>
          </UButton>
        </UDropdownMenu>
      </div>
    </div>
    <USeparator orientation="vertical" />
  </div>
</template>
