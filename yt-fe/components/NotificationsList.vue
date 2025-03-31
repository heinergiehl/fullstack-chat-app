<script lang="ts" setup>
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
  const acceptFriendRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      callApi("/friend-request/accept", {
        method: "PUT",
        credentials: "include",
        body: { requestId },
      })
    },
  })
  const queryClient = useQueryClient()

  function acceptFriendRequest(requestId: number) {
    acceptFriendRequestMutation.mutate(requestId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] })
        queryClient.invalidateQueries({ queryKey: ["friends"] })
      },
    })
  }

  const markAsReadMutation = useMarkNotificationAsRead()

  async function markAsRead(entry: IntersectionObserverEntry) {
    const notificationId = Number(
      entry.target.getAttribute("data-notification-id")
    )

    const cachedNotifications = queryClient.getQueryData<Notification[]>([
      "notifications",
    ])
    if (!cachedNotifications) return
    const notififcation = cachedNotifications.find(
      (n) => n.id === notificationId
    )
    if (!notififcation || notififcation?.read) return

    markAsReadMutation.mutate(notificationId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] })
        queryClient.invalidateQueries({ queryKey: ["friends"] })
      },
    })
  }
  const { observeElement } = useIntersectionObserver(markAsRead)
  function registerNotificationRef(el: HTMLElement) {
    observeElement(el)
  }
  const config = useRuntimeConfig()
  const backendBaseUrl = config.public.BACKEND_BASE_URL

  const { setActiveTabIndex } = useSideTabsStore()
</script>

<template>
  <div class="h-[calc(100vh-60px)] flex lg:w-[200px] w-[180px]">
    <USeparator orientation="vertical" />
    <div class="flex w-full flex-col">
      <div class="dark:text-gray-300 text-gray-500 text-xs" v-if="isLoading">
        Loading...
      </div>
      <div
        class="0 text-gray-500 text-xs p-2"
        v-else-if="!notifications || notifications.length === 0"
      >
        No notifications
      </div>

      <div v-else class="h-[calc(100vh-110px)] overflow-hidden overflow-y-auto">
        <div
          :ref="(el)=> registerNotificationRef(el as HTMLElement)"
          v-for="notification in notifications"
          :key="notification.id"
          :data-notification-id="notification.id"
          class="mb-2"
        >
          <UCard
            @click="
              () => {
                const notType =
                  notification.type === 'CHAT_MESSAGE'
                    ? '0'
                    : notification.type === 'FRIEND_REQUEST' ||
                      notification.type === 'FRIEND_REQUEST_ACCEPTED'
                    ? '1'
                    : '0'
                setActiveTabIndex(notType)
              }
            "
            :ui="{
              root: 'p-2 ',
              header: 'p-0 sm:px-0',
              footer: 'p-0 ',
              body: 'sm:p-1',
            }"
            class="rounded-none"
            :class="
              !notification.read
                ? 'bg-blue-100/60 dark:bg-blue-800/60'
                : 'bg-gray-200/60 dark:bg-gray-700/60'
            "
          >
            <template #header>
              <span class="text-xs dark:text-gray-400 text-gray-700">
                {{ new Date(notification.createdAt).toLocaleDateString() }}
              </span>
              <span class="text-xs dark:text-gray-400 text-gray-700 mx-1">
                {{ "/" }}</span
              >
              <span class="text-xs dark:text-gray-400 text-gray-700">
                {{ new Date(notification.createdAt).toLocaleTimeString() }}
              </span>
              <USeparator />
            </template>

            <ULink
              :to="
                notification.type === 'CHAT_MESSAGE'
                  ? `/chats/${notification.chatMessage?.chatId}`
                  : notification.type === 'FRIEND_REQUEST' ||
                    notification.type === 'FRIEND_REQUEST_ACCEPTED'
                  ? '/'
                  : notification.type === 'CHAT_CREATED'
                  ? `/chats/${notification.chatId}`
                  : '/'
              "
            >
              <span
                v-if="
                  notification.type === 'FRIEND_REQUEST' ||
                  notification.type === 'FRIEND_REQUEST_ACCEPTED'
                "
              >
                <UAvatar
                  size="xs"
                  :src="getAvatarUrl(notification.friendRequest?.sender)"
                />
              </span>
              <div class="flex">
                <span class="text-xs break-all">
                  {{ notification.message }}
                </span>
              </div>
            </ULink>
            <template #footer>
              <div
                v-if="
                  notification.type === 'FRIEND_REQUEST' &&
                  notification.friendRequest &&
                  notification.friendRequestId
                "
              >
                <UButton
                  @click="acceptFriendRequest(notification.friendRequestId)"
                  v-if="notification.friendRequest.status === 'PENDING'"
                >
                  Accept
                </UButton>
              </div>
            </template>
          </UCard>
        </div>
      </div>
    </div>
    <USeparator orientation="vertical" />
  </div>
</template>
