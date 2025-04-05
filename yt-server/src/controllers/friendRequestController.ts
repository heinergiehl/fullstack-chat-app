import type { Request, Response, NextFunction } from "express"
import prisma from "../../prisma/db"
import { FriendRequestStatus, NotificationType } from "@prisma/client"
import { getIO } from "../sockets/socketInstance"
import { emitToUser } from "../sockets/setupLobby"

export const sendFriendRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const senderId = req.user?.id

  const { receiverId } = req.body

  if (!senderId || !receiverId) {
    res.status(400).json({ error: "Invalid request" })
    return
  }
  if (senderId === receiverId) {
    res
      .status(400)
      .json({ error: "You cannot send a friend request to yourself" })
    return
  }

  const existingRequest = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    },
  })
  if (existingRequest) {
    if (existingRequest.receiverId === senderId) {
      res.status(400).json({
        error: "You already have a pending friend request from this user",
      })
      return
    }

    if (existingRequest.senderId === senderId) {
      res
        .status(400)
        .json({ error: "You already sent a friend request to this user" })
      return
    }
  }
  try {
    const result = await prisma.$transaction(async (ctx) => {
      const friendRequest = await ctx.friendRequest.create({
        data: {
          senderId,
          receiverId,
          status: FriendRequestStatus.PENDING,
        },
      })
      const sender = await ctx.user.findUnique({
        where: { id: senderId },
      })

      const notification = await ctx.notification.create({
        data: {
          userId: receiverId,
          type: NotificationType.FRIEND_REQUEST,
          message: `${sender?.name} sent you a friend request`,
          friendRequestId: friendRequest.id,
        },
        include: {
          friendRequest: true,
        },
      })

      return { friendRequest, notification }
    })
    const io = getIO()
    const { friendRequest, notification } = result
    emitToUser(io, receiverId, "friendRequestReceived", {
      friendRequest,
      notification,
    })
    res
      .status(201)
      .json({ message: "Friend request sent", friendRequest, notification })
  } catch (err) {
    next(err)
  }
}

export async function acceptFriendRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = req.user?.id

  const { requestId } = req.body

  if (!userId || !requestId) {
    res.status(400).json({ error: "Invalid request" })
    return
  }
  const friendRequest = await prisma.friendRequest.findFirst({
    where: {
      id: requestId,
    },
  })
  if (!friendRequest) {
    res.status(404).json({ error: "Friend request not found" })
    return
  }

  if (friendRequest.receiverId !== userId) {
    res
      .status(403)
      .json({ error: "You are not authorized to accept this friend request" })
  }

  const updatedFriendRequest = await prisma.friendRequest.update({
    where: { id: requestId },
    data: {
      status: FriendRequestStatus.ACCEPTED,
    },
  })

  const receiver = await prisma.user.findUnique({
    where: { id: userId },
  })
  const notification = await prisma.notification.create({
    data: {
      userId: friendRequest.senderId,

      type: NotificationType.FRIEND_REQUEST_ACCEPTED,
      message: `${receiver?.name} accepted your friend request`,
      friendRequestId: friendRequest.id,
    },
    include: {
      friendRequest: true,
    },
  })

  const io = getIO()

  emitToUser(io, friendRequest.senderId, "friendRequestAccepted", {
    friendRequest: updatedFriendRequest,
    notification,
  })
  emitToUser(io, friendRequest.receiverId, "friendRequestAccepted", {
    friendRequest: updatedFriendRequest,
    notification,
  })
  emitToUser(io, userId, "newFriendAdded", {
    friendRequest: updatedFriendRequest,
  })
  emitToUser(io, friendRequest.senderId, "newFriendAdded", {
    friendRequest: updatedFriendRequest,
  })
  res.status(200).json({ message: "Friend request accepted" })
}

export const getFriends = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id

  if (!userId) {
    res.status(400).json({ error: "Invalid request" })
    return
  }

  try {
    const friends = await prisma.friendRequest.findMany({
      where: {
        status: FriendRequestStatus.ACCEPTED,
        OR: [
          {
            senderId: userId,
          },
          {
            receiverId: userId,
          },
        ],
      },

      include: {
        sender: true,
        receiver: true,
        notifications: true,
      },
    })

    res.status(200).json({ friendRequests: friends })
  } catch (err) {
    next(err)
  }
}
