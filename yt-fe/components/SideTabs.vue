<script lang="ts" setup>
  const items = computed(() => [
    {
      label: "Chats",
      icon: "i-heroicons-chat-bubble-bottom-center-text",
      slot: "chats",
      unread: unreadChatsCount.value,
    },
    {
      label: "Friends",
      icon: "i-heroicons-user-group",
      slot: "friends",
      unread: unreadFriendsCount.value,
    },
    {
      label: "Notifications",
      icon: "i-heroicons-bell",
      slot: "notifications",
      unread: unreadNotificationsCount.value,
    },
  ])

  const { callApi } = useApi()
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const result = await callApi<Notification[]>("/notifications", {
        method: "GET",
        credentials: "include",
      })

      return result
    },
  })

  const unreadChatsCount = computed<number>(() =>
    notifications.value && notifications.value.length > 0
      ? notifications.value.filter((n) => !n.read && n.type === "CHAT_CREATED")
          .length
      : 0
  )

  const unreadNotificationsCount = computed(() =>
    notifications.value && notifications.value.length > 0
      ? notifications.value.filter((n) => !n.read).length
      : 0
  )
  const unreadFriendsCount = computed<number>(() => {
    return notifications.value && notifications.value.length > 0
      ? notifications.value.filter(
          (n) => !n.read && n.type === "FRIEND_REQUEST_ACCEPTED"
        ).length
      : 0
  })

  const store = useSideTabsStore()
</script>

<template>
  <div class="flex">
    <UTabs
      v-model="store.activeTabIndex"
      :ui="{
        label: 'hidden md:block',
        root: 'gap-0',
        list: 'h-[calc(100vh-60px)] rounded-none py-6 bg-gray-200 dark:bg-gray-900',
      }"
      :unmount-on-hide="true"
      variant="link"
      :items="items"
      orientation="vertical"
    >
      <template #leading="{ item }">
        <div>
          <span v-if="item.unread === 0" class="text-white rounded-full">
            <UIcon :name="item.icon" size="22" />
          </span>
          <UChip v-else :text="item.unread" size="xl" inset>
            <UIcon :name="item.icon" size="22" />
          </UChip>
        </div>
      </template>

      <template #chats>
        <ChatsList />
      </template>
      <template #friends>
        <FriendsList />
      </template>

      <template #notifications>
        <NotificationsList />
      </template>
    </UTabs>
  </div>
</template>
