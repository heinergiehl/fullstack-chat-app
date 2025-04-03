<script lang="ts" setup>
  const presenceStore = usePresenceStore()
  const { friends, isLoading } = useFriendList()
  const { onlineUsers: users } = storeToRefs(presenceStore)
  const route = useRoute()
  const routeName = route.name

  const dataUserAuth = useUserProfile(routeName)

  function isOnline(friendId: number) {
    return !!users.value.find((u) => u.id === friendId)
  }

  const oneToOneChatMutation = useCreateOneToOneChat()

  function startOneToOneChat(friend: User) {
    console.log("starting 1:1 chat with", friend)
    oneToOneChatMutation.mutate(
      { friendId: friend.id },
      {
        onSuccess: (data) => {
          console.log("1:1 chat created: ", data.chat)
        },
      }
    )
  }
  const isModalOpen = ref(false)
  const preSelectedFriends = ref<number[]>([])
  const groupFriendOptions = computed(() => {
    const currentUserId = dataUserAuth.data.value?.user?.id

    if (friends.value.length === 0) return []
    return friends.value
      .filter((f) => f.id !== currentUserId)
      .map((f) => ({
        value: f.id,
        label: f.name,
      }))
  })
  function openGroupChatModal(friendIds: number[]) {
    isModalOpen.value = true
    preSelectedFriends.value = friendIds
    console.log("openChatModal", friendIds)
  }

  function addFriendToGroupChat(friend: User) {
    openGroupChatModal([friend.id])
  }

  function getDropdownItems(friend: User) {
    return [
      [
        {
          label: "Start 1:1 Chat",
          icon: "i-heroicons-chat-bubble-bottom-center-text",
          onSelect: () => startOneToOneChat(friend),
        },
        {
          label: "Add to Group Chat",
          icon: "i-heroicons-user-group",
          onSelect: () => addFriendToGroupChat(friend),
        },
      ],
    ]
  }

  const { callApi } = useApi()
  const queryClient = useQueryClient()

  async function markAsRead(entry: IntersectionObserverEntry) {
    const notId = Number(entry.target.getAttribute("data-notification-id"))
    console.log("markAsRead in FriendsList", notId)
    if (!notId) return

    const cachedNotification = queryClient.getQueryData<Notification[]>([
      "notifications",
    ])
    console.log("cachedNotification in FriendsList", cachedNotification)
    const notification = cachedNotification?.find((n) => n.id === notId)
    console.log("notification in FriendsList", notification)
    if (!notification || notification.read) return
    try {
      await callApi(`/notifications/${notification.id}/read`, {
        method: "PUT",
        credentials: "include",
      })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["chats"] })
    } catch (err) {
      console.error(err)
    }
  }

  const { observeElement } = useIntersectionObserver(markAsRead)
  function registerEl(el: Element | null) {
    observeElement(el as HTMLElement | null)
  }
</script>

<template>
  <div class="flex h-[calc(100vh-60px)] lg:w-[200px] w-[180px]">
    <USeparator orientation="vertical" />
    <div class="flex flex-col lg:w-[200px] w-[180px]">
      <div v-if="isLoading" class="dark:text-gray-300 text-xs text-gray-500">
        Loading...
      </div>
      <div
        v-else-if="!friends || friends.length === 0"
        class="text-gray-500 text-xs p-2"
      >
        No friends
      </div>
      <div
        class="flex flex-col space-y-1 w-full bg-gray-200/60 dark:bg-gray-700/60 mb-2"
        v-for="friend in friends"
        :data-notification-id="friend.notification?.id"
        :ref="(el) =>registerEl(el as HTMLElement)"
        :key="friend.id"
      >
        <UDropdownMenu :items="getDropdownItems(friend)">
          <div
            class="p-2 space-x-2 flex items-center justify-between cursor-pointer dark:hover:bg-gray-800 hover:bg-gray-200"
          >
            <div class="flex items-center">
              <UChip
                inset
                size="sm"
                :color="isOnline(friend.id) ? 'success' : 'neutral'"
              >
                <UAvatar :src="getAvatarUrl(friend)" />
              </UChip>

              <span class="ml-2 select-none truncate lg:w-[140px] w-[90px]">{{
                friend.name
              }}</span>
            </div>
          </div>
        </UDropdownMenu>
      </div>
      <GroupChatModal
        v-model:open="isModalOpen"
        :friendOptions="groupFriendOptions"
        :preSelectedFriends="preSelectedFriends"
      />
    </div>
    <USeparator orientation="vertical" />
  </div>
</template>
