import type { Request, Response, NextFunction } from "express"

import type { AuthenticatedRequest } from "./chatController"
import prisma from "../../prisma/db"
import { getIO } from "../sockets/socketInstance"
import { emitToUser } from "../sockets/presence"

interface SendMessageBody {
  chatId: number
  content: string
  attachments: {
    mediaUrl: string
    type: "GIF" | "IMAGE"
  }[]
}

export const sendMessage = async (
  req: AuthenticatedRequest<SendMessageBody>,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id

  const { chatId, content, attachments } = req.body

  if (!content.trim() && (!attachments || attachments.length === 0)) {
    res.status(400).json({ error: "No content provided" })
    return
  }

  const chat = await prisma.chat.findUnique({
    where: {
      id: chatId,
    },
    include: {
      participants: true,
    },
  })
  if (!chat) {
    res.status(404).json({ error: "Chat not found" })
    return
  }
  const isParticipant = chat.participants.some((p) => p.userId === userId)

  if (!isParticipant) {
    res.status(403).json({ error: "You are not a participant of this chat" })
    return
  }

  const { message, notifications } = await prisma.$transaction(async (ctx) => {
    const newMessage = await ctx.chatMessage.create({
      data: { chatId, senderId: userId!, content },
    })
    if (attachments && attachments.length > 0) {
      await ctx.chatMessageMedia.createMany({
        data: attachments.map((att) => ({
          messageId: newMessage.id,
          mediaUrl: att.mediaUrl,
          type: att.type,
        })),
      })
    }

    await ctx.chat.update({
      where: { id: chatId },
      data: { lastMessageId: newMessage.id },
    })

    const authUser = await ctx.user.findUnique({ where: { id: userId } })

    const createdNotifications = await Promise.all(
      chat.participants
        .filter((p) => p.userId !== userId)
        .map((p) =>
          ctx.notification.create({
            data: {
              userId: p.userId,
              type: "CHAT_MESSAGE",
              message: `${authUser!.name} sent a message in the chat`,
              messageId: newMessage.id,
            },
          })
        )
    )

    const messageWithMedia = await ctx.chatMessage.findUnique({
      where: { id: newMessage.id },
      include: { media: true, sender: true, notifications: true },
    })

    return { message: messageWithMedia, notifications: createdNotifications }
  })

  const io = getIO()

  chat?.participants.forEach((p) => {
    if (p.userId !== userId) {
      const notification = notifications.find((n) => n.userId === p.userId)

      emitToUser(io, p.userId, "chatMessageReceived", {
        message,
        notification,
      })
    }
  })
  res.status(201).json({ sucess: true, message })
}

export const getMessages = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id

  const chatId = parseInt(req.params.id!, 10)
  const chat = await prisma.chat.findUnique({
    where: {
      id: chatId,
    },
    include: {
      participants: true,
    },
  })

  if (!chat) {
    res.status(404).json({ error: "Chat not found" })
    return
  }

  const isParticipant = chat.participants.some((p) => p.userId === userId)
  if (!isParticipant) {
    res.status(403).json({ error: "You are not a participant of this chat" })
    return
  }
  const messages = await prisma.chatMessage.findMany({
    where: {
      chatId,
    },
    include: {
      media: true,
      sender: true,
      notifications: true,
    },
  })
  res.status(200).json({ messages })
}
