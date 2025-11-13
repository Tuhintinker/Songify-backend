import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import SongRoutes from "./routes/songRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ message: "🎧 Sopify backend with Socket.io & Chat is live!" });
});

app.use("/api/auth", authRoutes);
app.use("/api/songs", SongRoutes);

const server = createServer(app);

// =====================================
// ⚡ SOCKET.IO SETUP
// =====================================
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// 🧠 Active rooms (in-memory)
const activeRooms = {};

io.on("connection", (socket) => {
  console.log(`🟢 User connected: ${socket.id}`);

  // 🏠 Create Room
  socket.on("create-room", ({ username }) => {
    const roomId = Math.random().toString(36).substring(2, 8);
    activeRooms[roomId] = {
      host: socket.id,
      users: [username],
      messages: [], // 🆕 store chat history
    };

    socket.join(roomId);
    socket.emit("room-created", { roomId });
    console.log(`🎵 Room created by ${username}: ${roomId}`);
  });

  // 👥 Join Room
  socket.on("join-room", ({ roomId, username }) => {
    const room = activeRooms[roomId];
    if (!room) return socket.emit("error-message", "Room not found!");
    if (room.users.length >= 4)
      return socket.emit("error-message", "Room is full!");

    room.users.push(username);
    socket.join(roomId);

    // Send chat history + user list to new joiner
    socket.emit("chat-history", room.messages);
    io.to(roomId).emit("user-joined", { users: room.users });
    console.log(`👥 ${username} joined ${roomId}`);
  });

  // ▶️ Play Song
  socket.on("play-song", ({ roomId, songUrl, time }) => {
    io.to(roomId).emit("sync-play", { songUrl, time });
  });

  // ⏸️ Pause Song
  socket.on("pause-song", (roomId) => {
    io.to(roomId).emit("sync-pause");
  });

  // 💬 CHAT FEATURE
  socket.on("send-message", ({ roomId, username, message }) => {
    const room = activeRooms[roomId];
    if (!room) return;

    const newMsg = {
      username,
      message,
      timestamp: new Date().toISOString(),
    };

    // save last 50 messages max
    room.messages.push(newMsg);
    if (room.messages.length > 50) room.messages.shift();

    // broadcast to everyone in the room
    io.to(roomId).emit("new-message", newMsg);
    console.log(`💬 [${roomId}] ${username}: ${message}`);
  });

  // ❌ Disconnect
  socket.on("disconnect", () => {
    console.log(`🔴 ${socket.id} disconnected`);

    for (const [roomId, room] of Object.entries(activeRooms)) {
      if (room.host === socket.id) {
        io.to(roomId).emit("room-closed");
        delete activeRooms[roomId];
        console.log(`❌ Room ${roomId} closed`);
      }
    }
  });
});

// =====================================
// ⚙️ MongoDB & Server Start
// =====================================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB error:", err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Express + Socket.io + Chat running on port ${PORT}`)
);
