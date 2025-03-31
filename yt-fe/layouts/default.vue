<template>
  <ClientOnly>
    <Navigation />
    <!-- Make the container fill available space -->
    <UContainer class="">
      <div class="dark:bg-gray-950 flex w-full">
        <!-- Left side tabs, fixed width -->
        <SideTabs />

        <!-- Middle slot grows to fill leftover space -->
        <div class="flex-1">
          <slot />
        </div>

        <!-- Right lobby sidebar, fixed width -->
        <LobbySidebar />
      </div>
    </UContainer>
  </ClientOnly>
</template>

<script lang="ts" setup>
  const presenceStore = usePresenceStore()
  useRealtimeFriendRequests()
  useUseRealtimeFriends()
  useUseRealtimeChats()
  useUseRealtimeChatMessages()
  onMounted(() => {
    console.log("mountedRUNNING")
    presenceStore.initializePresence()
  })
</script>

<style></style>
