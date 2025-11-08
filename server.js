import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";

import SongRoutes from "./routes/songRoutes.js";


dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Simple test route
app.get("/api/health", (req, res) => {
  res.json({ message: "Sopify backend is running!" });
});

app.use("/api/auth", authRoutes);
app.use("/api/songs", SongRoutes);


// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
