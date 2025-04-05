import { Server, Socket } from "socket.io"
import prisma from "../../prisma/db"
interface MinimalUser {
  id: number
  name: string
  profile_image: string | null
  chatId?: number
}

const userDataMap = new Map<number, MinimalUser>()

const userToSockets = new Map<number, Set<string>>()

export function setupLobby(io: Server): void {
  console.log("Setting up presence")

  io.on("connection", async (socket: Socket) => {
    console.log("Socket connected: ", socket.id)

    if (socket.data.user.id) {
      const userId = socket.data.user.id as number

      const fullUser = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      })
      if (!fullUser) {
        return
      }

      const minimalUser: MinimalUser = {
        id: fullUser.id,
        name: fullUser.name,
        profile_image: fullUser.profile_image,
      }
      userDataMap.set(userId, minimalUser)

      const existingSockets = userToSockets.get(userId) ?? new Set<string>()
      existingSockets.add(socket.id)
      userToSockets.set(userId, existingSockets)
      broadcastOnlineUsersToLobby(io)
    } else {
      console.log("Socket connected without authenticated user data")
    }
    socket.on(
      "leaveLobby",
      async (
        {},
        callback?: (ack: { success: boolean; message?: string }) => void
      ) => {
        console.log("Socket leaving room: ", socket.id)
        deleteSocketIdAndUserFromMemory(socket, io)
        callback?.({ success: true, message: "Left room successfully" })
      }
    )
    socket.on("disconnect", () => {
      console.log("Socket disconnected: ", socket.id)
      deleteSocketIdAndUserFromMemory(socket, io)
    })

    socket.on("joinLobby", async (roomId: string) => {
      console.log("Socket joining room: ", roomId)
      socket.join(roomId)
      const user = socket.data.user
      console.log(`User ${user?.id} joined room ${roomId}`)
      const fullUser = await prisma.user.findUnique({
        where: { id: user?.id },
      })
      if (!fullUser) {
        return
      }
      const userData: MinimalUser = {
        id: fullUser.id,
        name: fullUser.name,
        profile_image: fullUser.profile_image,
      }
      userDataMap.set(user.id, userData)
      const existingSockets = userToSockets.get(user.id) ?? new Set<string>()
      existingSockets.add(socket.id)
      userToSockets.set(user.id, existingSockets)
      userDataMap.set(user.id, userData)
      //console log all sockets for the user
      console.log("User sockets: ", userToSockets.get(user.id))
      broadcastOnlineUsersToLobby(io)
      broadcastOnlineUsersToChatRoom(io, parseInt(roomId))
    })
  })
}

export function broadcastOnlineUsersToLobby(io: Server): void {
  const onlineUsers = Array.from(userToSockets.keys()).map((userId) =>
    userDataMap.get(userId)
  )
  console.log("Broadcasting presence", onlineUsers)
  io.emit("presenceUpdate", onlineUsers)
}
export function broadcastOnlineUsersToChatRoom(
  io: Server,
  chatId: number
): void {
  const onlineUsersInChat = Array.from(userDataMap.values()).filter(
    (user) => user.chatId === chatId
  )
  console.log(
    `Broadcasting chat presence for chat ${chatId}`,
    onlineUsersInChat
  )
  if (!chatId) {
    console.log("No chatId provided in broadcastOnlineUsersToChatRoom")
    return
  }
  io.to(chatId.toString()).emit("chatPresenceUpdate", onlineUsersInChat)
}

export function deleteSocketIdAndUserFromMemory(socket: Socket, io: Server) {
  console.log("Socket disconnected: ", socket.id)
  let userId: number | undefined

  for (const [uId, sockets] of userToSockets.entries()) {
    if (sockets.has(socket.id)) {
      userId = uId
      break
    }
  }

  if (userId !== undefined) {
    const userSockets = userToSockets.get(userId)
    if (userSockets) {
      userSockets.delete(socket.id)

      if (userSockets.size === 0) {
        userToSockets.delete(userId)
        userDataMap.delete(userId)
      }
    }
  }
  broadcastOnlineUsersToLobby(io)
}

export function emitToUser(
  io: Server,
  userId: number,
  event: string,
  data: any
) {
  const socketIds = userToSockets.get(userId)

  if (socketIds) {
    for (const sId of socketIds) {
      console.log("Emitting to user: ", userId, event, data)
      io.to(sId).emit(event, data)
    }
  }
}

export function updateUserInMemory(
  userId: number,
  newData: Partial<MinimalUser>
) {
  const existing = userDataMap.get(userId)
  if (!existing) {
    return
  }
  const updated: MinimalUser = { ...existing, ...newData }
  console.log("Updating user in memory: ", userId, updated)
  userDataMap.set(userId, updated)
}
