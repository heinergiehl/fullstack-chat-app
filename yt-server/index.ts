import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import path from "path"
import authRoutes from "./src/routes/authRoutes"
import profileRoutes from "./src/routes/profileRoutes"
import { errorHandler } from "./src/middleware/errorHandler"
import http from "http"
import { Server } from "socket.io"
import cookie from "cookie"
import jwt from "jsonwebtoken"
import { setIO } from "./src/sockets/socketInstance"
import { setupPresence } from "./src/sockets/presence"
import friendRequestRoutes from "./src/routes/friendRequestRoutes"
import notificationRoutes from "./src/routes/notificationRoutes"
import chatRoutes from "./src/routes/chatRoutes"
import { setupChat } from "./src/sockets/setupchat"
import { asyncHandler } from "./src/utils/asyncHandler"
const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(errorHandler)
// app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }))
app.use("/storage", express.static(path.join(__dirname, "./storage")))
app.use("/api", authRoutes)
app.use("/api/profile", profileRoutes)
app.use("/api/friend-request", friendRequestRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/chats", chatRoutes)

app.get(
  "/",
  asyncHandler(async (req, res, next) => {
    res.json({ message: "Hello World!" })
    return
  })
)
const httpServer = http.createServer(app)

const ioServer = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["*"],
    credentials: true,
  },
})

setIO(ioServer)
ioServer.use((socket, next) => {
  const cookies = socket.request.headers.cookie
  if (!cookies) {
    return next(new Error("Authentication error"))
  }
  const parsedCookie = cookie.parse(cookies)
  const token = parsedCookie.token
  if (!token) {
    return next(new Error("Authentication error"))
  }
  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
    if (err) {
      return next(new Error("Authentication error"))
    }
    socket.data.user = decoded
    next()
  })
})

setupPresence(ioServer)
setupChat(ioServer)

httpServer.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}!`)
})
