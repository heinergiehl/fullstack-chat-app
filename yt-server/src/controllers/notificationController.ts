import type { Request, Response, NextFunction } from "express"
import prisma from "../../prisma/db"
import type { Notification, NotificationType } from "@prisma/client"

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        friendRequest: {
          include: {
            sender: true,
          },
        },
        chatMessage: {
          include: {
            chat: true,
          },
        },
      },
    })
    res.status(200).json(notifications)
  } catch (err) {
    next(err)
  }
}

export const getNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chatId = req.params.id
  if (!chatId) {
    res.status(400).json({ error: "Bad Request" })
    return
  }
  const parsedChatId = parseInt(chatId)
  const notifactionType = req.params.type
  const userId = req.user?.id
  if (!notifactionType || !userId) {
    res.status(400).json({ error: "Bad Request" })
    return
  }
  try {
    const notification = await prisma.notification.findMany({
      where: {
        chatId: parsedChatId,
        type: notifactionType as NotificationType,
        userId,
      },
    })

    if (!notification) {
      res.status(404).json({ error: "Notification not found" })
      return
    }
    res.status(200).json(notification)
  } catch (err) {
    next(err)
  }
}

export const markNotificationAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const notificationId = req.params.id
  if (!notificationId) {
    res.status(400).json({ error: "Bad Request" })
    return
  }
  const parsedNotificationId = parseInt(notificationId, 10)
  const notification = await prisma.notification.findUnique({
    where: {
      id: parsedNotificationId,
    },
  })
  if (!notification) {
    res.status(404).json({ error: "Notification not found" })
    return
  }

  try {
    const updatedNotification = await prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        read: true,
      },
    })
    console.log(
      "updatedNotification in markNotificationAsRead:",
      updatedNotification
    )
    res.status(200).json({ notification: updatedNotification })
  } catch (err) {
    next(err)
  }
}

export const getNotificationByTypeAndUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id
  const notificationType = req.params.type as NotificationType

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        type: notificationType,
      },
      include: {
        friendRequest: {
          include: {
            sender: true,
          },
        },
      },
    })
    res.status(200).json(notifications)
  } catch (err) {
    next(err)
  }
}
