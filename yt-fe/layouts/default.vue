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
  const socket = useNuxtApp().$socket
  onMounted(() => {
    if (!socket.connected) {
      socket.connect()
    }
    socket.emit("joinLobby")
    presenceStore.initializePresence()
  })
  const params = useRoute().params
  onBeforeUnmount(() => {
    console.log("unmountedRUNNING")
    socket.emit("leaveLobby", () => {
      socket.disconnect()
    })
    if (params.id) {
      socket.emit(
        "leaveChat",
        {
          chatId: params.id,
        },
        () => {
          socket.disconnect()
        }
      )
    }

    presenceStore.cleanUpPresence()
  })
</script>

<style></style>
