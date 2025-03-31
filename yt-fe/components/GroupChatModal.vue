<script lang="ts" setup>
  type FriendOption = {
    value: number
    label: string
  }

  const props = defineProps<{
    open: boolean
    friendOptions: FriendOption[]
    preSelectedFriends?: number[]
  }>()
  const emit = defineEmits<{ (e: "update:open", value: boolean): void }>()

  const internalOpen = ref(props.open)
  watch(
    () => props.open,
    (newVal) => {
      console.log("hello from 1st watch", newVal)
      internalOpen.value = newVal
    }
  )

  watch(internalOpen, (newVal) => {
    emit("update:open", newVal)
  })

  const selectedFriendIds = ref<number[]>([])

  watch(
    () => props.preSelectedFriends,
    (newVal) => {
      if (newVal) {
        selectedFriendIds.value = newVal
          .map(
            (id) => props.friendOptions.find((option) => option.value === id)!
          )
          .map((option) => option.value)
      }
    },
    { immediate: true }
  )
  const { mutateAsync, isPending, error } = useCreateGroupChat()
  async function onCreateGroupChat() {
    const payload = {
      friendIds: selectedFriendIds.value,
    }

    const response = await mutateAsync(payload)
    internalOpen.value = false
  }
</script>

<template>
  <UModal v-model:open="internalOpen" title="Group Chat">
    <template #body>
      <UFormField label="Select friends" name="friends">
        <USelect
          v-model="selectedFriendIds"
          :items="friendOptions"
          multiple
          placeholder="Select friends"
        />
      </UFormField>

      <div v-if="error" class="text-red-500">{{ error.message }}</div>
    </template>

    <template #footer>
      <UButton
        @click="onCreateGroupChat"
        :loading="isPending"
        :disabled="isPending"
      >
        Create
      </UButton>
    </template>
  </UModal>
</template>
