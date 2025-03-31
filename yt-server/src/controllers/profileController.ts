import type { Request, Response, NextFunction } from "express"
import prisma from "../../prisma/db"
import {
  broadcastPresence,
  emitToUser,
  updateUserInMemory,
} from "../sockets/presence"
import { getIO } from "../sockets/socketInstance"

export const getProfile = async (
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
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    })
    if (!user) {
      res.status(400).json({ error: "User not found" })
      return
    }
    res.status(200).json({ user })
  } catch (err) {
    next(err)
  }
}

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const { name } = req.body
  const updateData: any = {
    name,
  }
  if (req.file) {
    const { filename } = req.file as any
    updateData.profile_image = filename
  }
  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: updateData,
    })
    const userWithoutPassword = { ...updatedUser, password: undefined }

    updateUserInMemory(userId, { ...userWithoutPassword })

    const io = getIO()
    broadcastPresence(io)
    emitToUser(io, userId, "profileUpdated", { user: userWithoutPassword })

    res.status(200).json({ user: userWithoutPassword })
  } catch (err) {
    next(err)
  }
}
