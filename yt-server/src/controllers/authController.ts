import type { Request, Response, NextFunction } from "express"

import jwt from "jsonwebtoken"
import prisma from "../../prisma/db"

export const registerUser = async (
  req: Request<
    {},
    {},
    {
      name: string
      email: string
      password: string
    }
  >,
  res: Response,
  next: NextFunction
) => {
  const { name, email, password } = req.body

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    })
    if (existingUser) {
      res.status(400).json({ message: "User already exists" })
      return
    }
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password,
      },
    })

    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7days" }
    )
    res.cookie("token", token, {
      httpOnly: true,
    })
    res.status(201).json({ message: "User created successfully" })
  } catch (err) {
    next(err)
  }
}

export const loginUser = async (
  req: Request<
    {},
    {},
    {
      email: string
      password: string
    }
  >,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body

  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (!user) {
      res.status(400).json({ message: "Probably wrong email" })
      return
    }

    const isMatch = user.password === password

    if (!isMatch) {
      res.status(400).json({ message: "Probably wrong password" })
      return
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7days" }
    )
    res.cookie("token", token, {
      httpOnly: true,
    })
    res.status(200).json({ message: "User logged in successfully" })
  } catch (err) {
    next(err)
  }
}

export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.clearCookie("token")
  res.status(200).json({ message: "User logged out successfully" })
}
