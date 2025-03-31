import { io, Socket } from "socket.io-client"

export default defineNuxtPlugin((nuxtApp) => {
  const config = nuxtApp.$config
  const backendUrl = config.public.BACKEND_BASE_URL
  console.log("Backend URL:", backendUrl)

  const socket = io(backendUrl, {
    withCredentials: true,
    autoConnect: false,
  })

  socket.on("connection", () => {
    console.log("Global socket connected: ", socket.id)
  })

  return {
    provide: {
      socket,
    },
  }
})
