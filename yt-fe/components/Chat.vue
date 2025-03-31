<script lang="ts" setup>
  import "vue3-emoji-picker/css"
  import EmojiPicker from "vue3-emoji-picker"

  const route = useRoute()
  const chatId = ref(Number(route.params.id))
  const userProfileQuery = useUserProfile()
  const chatQuery = useGetChatWithMessages(chatId.value)
  const { typingIndicators, emitTyping } = useRealtimeTypingIndicator(
    chatId.value
  )

  const otherTypingIndicators = computed(() =>
    typingIndicators.value.filter(
      (ti) => ti.userId !== userProfileQuery.data?.value?.user?.id
    )
  )

  const message = ref("")
  interface Attachment {
    mediaUrl: string
    type: "GIF" | "IMAGE"
  }
  const attachments = ref<Attachment[]>([])

  function removeAttachment(index: number) {
    attachments.value.splice(index, 1)
  }

  const { mutateAsync } = useSendMessage()
  const queryClient = useQueryClient()
  const chatContainer = ref<HTMLElement | null>(null)

  function scrollToBottom() {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  }

  async function sendMessage() {
    if (!message.value.trim() && attachments.value.length === 0) return
    emitTyping(false)

    const payload = {
      chatId: chatId.value,
      content: message.value,
      attachments: attachments.value,
    }
    await mutateAsync(payload)
    message.value = ""
    attachments.value = []
    await nextTick()
    scrollToBottom()
  }

  function OnInput() {
    emitTyping(true)
  }

  function onBlur() {
    emitTyping(false)
  }

  const showEmojiPicker = ref(false)
  function toggleEmojiPicker() {
    showEmojiPicker.value = !showEmojiPicker.value
  }
  function onSelectEmoji(emoji: any) {
    message.value += emoji.i
    showEmojiPicker.value = false
  }

  const showGifPicker = ref(false)
  function toggleGifPicker() {
    showGifPicker.value = !showGifPicker.value

    console.log("showGifPicker: ", showGifPicker.value)
  }

  function onSelectGif(gifUrl: string) {
    attachments.value.push({ mediaUrl: gifUrl, type: "GIF" })
    showGifPicker.value = false
  }
  const imageInput = ref<HTMLInputElement | null>(null)

  function triggerImageInput() {
    if (imageInput.value) {
      imageInput.value.click()
    }
  }

  async function onImageSelected(event: Event) {
    const target = event.target as HTMLInputElement
    if (!target.files) return

    const files = Array.from(target.files)
    for (const file of files) {
      const formData = new FormData()
      formData.append("file", file)
      const data = await callApi<{ storedFilename: string }>("/chats/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      // Use the returned stored filename in your attachments array.
      attachments.value.push({ mediaUrl: data.storedFilename, type: "IMAGE" })
    }
    target.value = ""
  }
  watch(
    () => chatQuery.data.value?.messages,
    () => {
      nextTick(() => scrollToBottom())
    },
    { immediate: true, deep: true }
  )

  onMounted(() => {
    scrollToBottom()
  })

  onUpdated(() => {
    scrollToBottom()
  })

  const { callApi } = useApi()

  const { observeElement } = useIntersectionObserver(markAsRead)
  async function markAsRead(entry: IntersectionObserverEntry) {
    const msgId = Number(entry.target.getAttribute("data-msg-id"))
    if (!msgId) return
    const msg = chatQuery.data.value?.messages?.find((m) => m.id === msgId)
    if (!msg) return

    const notification = msg.notifications?.find(
      (n) => n.userId === userProfileQuery.data.value?.user?.id
    )
    if (!notification || notification.read) return
    try {
      await callApi(`/notifications/${notification.id}/read`, {
        method: "PUT",
        credentials: "include",
      })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["chats"] })
    } catch (error) {
      console.error("Failed to mark message notification as read", error)
    }
  }
  function registerMessageRef(el: HTMLElement | null) {
    if (!el) return
    observeElement(el)
  }
  const colorMode = useColorMode()
  const isLoading = chatQuery.isLoading
  const error = chatQuery.error
  const chat = chatQuery.data
  const backendBaseUrl = useRuntimeConfig().public.BACKEND_BASE_URL

  const { onlineUsersInChat } = useChatPresence()

  const isOnline = (userId: number | undefined) => {
    if (!onlineUsersInChat.value) return false
    return onlineUsersInChat.value.some((user) => user.id === userId)
  }
</script>

<template>
  <div class="flex h-full w-full">
    <div class="flex flex-col relative flex-1">
      <div v-if="isLoading" class="p-4 h-[90px] text-gray-400">Loading...</div>
      <div v-else-if="error" class="p-4 h-[90px] text-gray-400">Error...</div>
      <div v-else>
        <div class="flex flex-col py-4 h-[90px]">
          <div class="text-lg font-bold text-center">Chat {{ chat?.id }}</div>

          <USeparator />
          <div
            class="flex flex-wrap items-center justify-center text-gray-500 text-sm"
          >
            <span v-if="chat?.participants?.length" class="mr-1 md:block hidden"
              >with the following participants:
            </span>

            <span
              class="text-xs dark:text-gray-300 text-gray-700"
              v-for="participant in chat?.participants?.filter(
                (p) => p.user?.id !== userProfileQuery.data.value?.user?.id
              )"
              :key="participant.id"
            >
              <UAvatarGroup>
                <UChip
                  :color="
                    isOnline(participant.user?.id) ? 'success' : 'neutral'
                  "
                >
                  <UTooltip
                    v-if="participant.user"
                    :text="participant.user.name"
                  >
                    <UAvatar
                      :name="participant.user?.name"
                      :src="getAvatarUrl(participant.user)"
                    />
                  </UTooltip>
                </UChip>
              </UAvatarGroup>
            </span>
          </div>
        </div>

        <USeparator />
        <!-- chat container -->
        <div
          class="h-[58vh] md:h-[64vh] p-4 overflow-y-auto space-y-4 flex flex-col"
          ref="chatContainer"
        >
          <div
            v-for="message in chat?.messages"
            :key="message.id"
            :data-msg-id="message.id"
            :ref="(el) => registerMessageRef(el as HTMLElement)"
            :class="
              message.senderId === userProfileQuery.data.value?.user?.id
                ? 'self-end bg-blue-100/60 dark:bg-blue-800/60'
                : 'self-start bg-gray-200/60 dark:bg-gray-700/60'
            "
            class="max-w-xs rounded-lg shadow-md p-2"
          >
            <div>
              <div
                class="text-xs italic"
                :class="
                  message.senderId === userProfileQuery.data.value?.user?.id
                    ? 'text-gray-200'
                    : 'text-gray-400'
                "
              >
                {{ message?.sender?.name }} says:
              </div>
            </div>
            <p class="break-words">{{ message.content }}</p>

            <div v-if="message.media && message.media.length" class="mt-2">
              <div v-for="attachment in message.media" :key="attachment.id">
                <img
                  v-if="attachment.type === 'GIF'"
                  :src="attachment.mediaUrl"
                  @load="scrollToBottom"
                  class="max-w-[200px] h-auto rounded-lg"
                />

                <img
                  v-else-if="attachment.type === 'IMAGE'"
                  :src="`
                ${backendBaseUrl}/storage/chatMedia/${attachment.mediaUrl}
                  `"
                  @load="scrollToBottom"
                  class="max-w-[200px] h-auto rounded-lg"
                />
              </div>
            </div>
            <div class="text-xs text-gray-3300 mt-1">
              {{ new Date(message.createdAt).toLocaleString() }}
            </div>
          </div>
        </div>
        <!-- end of chat container -->
        <!-- typing indicator -->
        <UCard
          v-if="otherTypingIndicators.length > 0"
          :ui="{ body: 'sm:p-1 p-1' }"
          class="z-10 text-sm text-gray-500 italic absolute bottom-[16%] md:bottom-[10%] left-[50%] translate-x-[-50%]"
        >
          <span v-for="(ti, index) in otherTypingIndicators" :key="index">
            {{ ti.name }} is typing...
          </span>
        </UCard>
        <!-- end of typing indicator -->

        <!-- input area -->
        <div class="relative flex flex-col items-center p-4 mt-8">
          <div
            class="md:flex md:flex-row flex flex-col space-y-4 md:space-y-0 items-center w-full"
          >
            <UInput
              v-model="message"
              @input="OnInput"
              @blur="onBlur"
              placeholder="Type a message..."
              class="mr-2 min-w-[180px] w-full"
            />
            <!-- attachment previews -->

            <div
              v-for="(attachment, index) in attachments"
              :key="index"
              class="relative ml-2"
            >
              <img
                v-if="attachment.type === 'IMAGE'"
                class="w-12 h-12 object-cover rounded-md"
                :src="`
                ${backendBaseUrl}/storage/chatMedia/${attachment.mediaUrl}

                `"
                alt=""
                @load="scrollToBottom"
              />
              <img
                v-else-if="attachment.type === 'GIF'"
                class="w-12 h-12 object-cover rounded-md"
                :src="attachment.mediaUrl"
                alt=""
                @load="scrollToBottom"
              />
              <UButton
                class="cursor-pointer absolute top-[5px] right-[2px] text-xs p-1 w-4 h-4"
                @click="removeAttachment(index)"
                color="error"
                >x</UButton
              >
            </div>

            <!-- button section -->
            <div class="flex items-center space-x-1">
              <UButton @click="toggleEmojiPicker" variant="ghost">
                <UIcon name="i-heroicons-face-smile" size="20" />
              </UButton>
              <UButton @click="toggleGifPicker" variant="ghost">
                <UIcon name="i-heroicons-gif" size="20" />
              </UButton>

              <UButton @click="triggerImageInput" variant="ghost">
                <UIcon name="i-heroicons-photo" size="20" />
              </UButton>
              <UButton color="primary" @click="sendMessage">Send</UButton>
            </div>
          </div>

          <!-- Hidden file input for images -->
          <input
            type="file"
            ref="imageInput"
            accept="image/*"
            multiple
            style="display: none"
            @change="onImageSelected"
          />
          <!-- end of file input for images -->
          <!-- emoji picker -->
          <div v-if="showEmojiPicker" class="absolute bottom-full right-0 z-20">
            <EmojiPicker
              :native="true"
              @select="onSelectEmoji"
              :theme="colorMode.value === 'dark' ? 'dark' : 'light'"
            />
          </div>

          <!-- end of emoji picker -->
          <!-- gif picker -->
          <div v-if="showGifPicker" class="absolute bottom-full right-0 z-20">
            <GifPicker @select="onSelectGif" />
          </div>
          <!-- end of input area -->
        </div>
      </div>
    </div>
    <USeparator orientation="vertical" />
  </div>
</template>
