import type { Server, Socket } from "socket.io"
import {
  broadcastChatPresence,
  broadcastPresence,
  emitToUser,
  updateUserInMemory,
} from "./presence"
import prisma from "../../prisma/db"

export function setupChat(io: Server): void {
  io.on("connection", (socket: Socket) => {
    // Listen for a joinChat event, so clients join a specific chat room.
    socket.on("joinChat", async ({ chatId }: { chatId: number }) => {
      socket.join(chatId.toString())

      const user = socket.data.user
      console.log(`User ${user?.id} joined chat ${chatId}`)

      const fullUser = await prisma.user.findUnique({
        where: {
          id: user?.id,
        },
      })

      if (!fullUser) {
        return
      }
      // update user in memory
      const userData = {
        id: fullUser.id,
        name: fullUser.name,
        profile_image: fullUser.profile_image,
        chatId: chatId,
      }
      updateUserInMemory(fullUser.id, userData)

      socket.to(chatId.toString()).emit("userJoined", {
        userId: fullUser.id,
        name: fullUser.name,
        profile_image: fullUser.profile_image,
        chatId: chatId,
      })
      broadcastChatPresence(io, chatId)
    })
    socket.on("leaveChat", async ({ chatId }: { chatId: number }) => {
      if (!chatId) {
        console.log("No chatId provided in leaveChat event")
        return
      }
      const user = socket.data.user

      const fullUser = await prisma.user.findUnique({
        where: {
          id: user.id,
        },
      })
      if (!fullUser) {
        console.log("User not found")
        return
      }
      socket.to(chatId.toString()).emit("userLeft", {
        userId: fullUser?.id,
        name: fullUser?.name,
        profile_image: fullUser?.profile_image,
        chatId: chatId,
      })

      console.log(`User ${user?.id} left chat ${chatId}`)
      // remove user from memory
      updateUserInMemory(fullUser.id, { chatId: undefined })
      broadcastChatPresence(io, chatId)
      socket.leave(chatId.toString())
    })

    socket.on(
      "typing",
      async (payload: { chatId: number; isTyping: boolean }) => {
        const { chatId, isTyping } = payload

        const user = socket.data.user
        console.log(`User ${user?.id} is typing in chat ${chatId}`)
        socket.to(chatId.toString()).emit("typingIndicator", {
          userId: socket.data.user?.id,
          name: user?.name,
          isTyping,
        })
      }
    )
  })
}
