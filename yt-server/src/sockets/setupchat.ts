import type { Server, Socket } from "socket.io"
import {
  broadcastChatPresence,
  broadcastPresence,
  emitToUser,
  handleDisconnect,
  updateUserInMemory,
} from "./presence"
import prisma from "../../prisma/db"

export function setupChat(io: Server): void {
  io.on("connection", (socket: Socket) => {
    // Handler for joining a chat room.
    socket.on(
      "joinChat",
      async (
        { chatId }: { chatId: number },
        callback?: (ack: { success: boolean; message?: string }) => void
      ) => {
        try {
          socket.join(chatId.toString())

          const user = socket.data.user
          console.log(`User ${user?.id} joined chat ${chatId}`)

          const fullUser = await prisma.user.findUnique({
            where: { id: user?.id },
          })

          if (!fullUser) {
            if (callback)
              callback({ success: false, message: "User not found" })
            return
          }

          // Update user in memory.
          const userData = {
            id: fullUser.id,
            name: fullUser.name,
            profile_image: fullUser.profile_image,
            chatId,
          }

          // Notify other users in the chat room.
          socket.to(chatId.toString()).emit("userJoined", {
            userId: fullUser.id,
            name: fullUser.name,
            profile_image: fullUser.profile_image,
            chatId,
          })

          updateUserInMemory(fullUser.id, userData)
          broadcastChatPresence(io, chatId)
          broadcastPresence(io)

          if (callback)
            callback({ success: true, message: "Joined chat successfully" })
        } catch (error) {
          console.error("Error in joinChat event:", error)
          if (callback)
            callback({ success: false, message: "Error joining chat" })
        }
      }
    )

    // Handler for leaving a chat room.
    socket.on(
      "leaveChat",
      async (
        { chatId }: { chatId: number },
        callback: (ack: { success: boolean; message?: string }) => void
      ) => {
        try {
          if (!chatId) {
            console.log("No chatId provided in leaveChat event")
            return callback({ success: false, message: "No chatId provided" })
          }

          const user = socket.data.user
          const fullUser = await prisma.user.findUnique({
            where: { id: user.id },
          })

          if (!fullUser) {
            console.log("User not found")
            return callback({ success: false, message: "User not found" })
          }

          // Notify other users that this user has left the chat.
          socket.to(chatId.toString()).emit("userLeft", {
            userId: fullUser.id,
            name: fullUser.name,
            profile_image: fullUser.profile_image,
            chatId: undefined,
          })

          console.log(`User ${user?.id} left chat ${chatId}`)

          socket.leave(chatId.toString())
          // Remove the user from the in-memory store.
          updateUserInMemory(fullUser.id, { chatId: undefined })
          broadcastChatPresence(io, chatId)
          broadcastPresence(io)

          return callback({ success: true, message: "Left chat successfully" })
        } catch (error) {
          console.error("Error processing leaveChat:", error)
          return callback({ success: false, message: "Error leaving chat" })
        }
      }
    )

    // Handler for typing indicators.
    socket.on(
      "typing",
      async (payload: { chatId: number; isTyping: boolean }) => {
        const { chatId, isTyping } = payload
        const user = socket.data.user
        console.log(`User ${user?.id} is typing in chat ${chatId}`)
        socket.to(chatId.toString()).emit("typingIndicator", {
          userId: user?.id,
          name: user?.name,
          isTyping,
        })
      }
    )
    socket.on(
      "logout",
      async (
        { chatId }: { chatId: number },
        callback: (ack: { success: boolean; message?: string }) => void
      ) => {
        const user = socket.data.user
        if (!user) return
        handleDisconnect(socket, io)
        // Check if user is in a chat room:
        if (user.chatId) {
          // Notify other chat users the user is leaving:
          socket.to(user.chatId.toString()).emit("userLeft", {
            userId: user.id,
            name: user.name,
            profile_image: user.profile_image,
            chatId: undefined,
          })

          // Remove user from the chat room:
          socket.leave(user.chatId.toString())

          // Update in-memory data:
          updateUserInMemory(user.id, { chatId: undefined })

          // Broadcast updated chat and global presence:
          broadcastChatPresence(io, user.chatId)
        }
        console.log(`User ${user?.id} logged out in setupChat`)
        callback?.({
          success: true,
          message: "User logged out successfully",
        })
      }
    )
  })
}
