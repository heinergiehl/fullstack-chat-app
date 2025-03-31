import { Router } from "express"
import { authenticateToken } from "../middleware/authenticateToken"
import multer from "multer"
import {
  createGroupChat,
  createOneToOneChat,
  deleteChat,
  getChatById,
  getChats,
} from "../controllers/chatController"
import { getMessages, sendMessage } from "../controllers/messageController"
import type { Request, Response, NextFunction } from "express"
import fs from "fs"
import path from "path"

// Configure Multer storage options with proper TypeScript annotations.
const storageFolderPath = path.join(__dirname, "../../storage/chatMedia")
if (!fs.existsSync(storageFolderPath)) {
  fs.mkdirSync(storageFolderPath, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "storage/chatMedia") // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + "-" + file.originalname)
  },
})

const upload = multer({ storage })

const router = Router()
router.get("/", authenticateToken, getChats)
router.get("/:chatId", authenticateToken, getChatById)
router.post("/one-to-one", authenticateToken, createOneToOneChat)
router.post("/group", authenticateToken, createGroupChat)
router.delete("/:chatId", authenticateToken, deleteChat)

// chat messages
// Integrated upload endpoint.
router.post(
  "/upload",
  authenticateToken,
  upload.single("file"),
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" })
      return
    }
    console.log("File uploaded:", req.file)
    // Return the stored filename to the client.
    res.json({ storedFilename: req.file.filename })
  }
)
router.get("/:chatId/messages", authenticateToken, getMessages)

router.post("/:chatId/messages", authenticateToken, sendMessage)

export default router
