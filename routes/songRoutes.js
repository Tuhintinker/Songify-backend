import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import Song from "../models/Song.js";

const router = express.Router();

// Define two storages
// Two separate storages
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (file.fieldname === "song") {
      return {
        folder: "sopify_songs",
        resource_type: "video", // allows mp3/mp4
      };
    } else if (file.fieldname === "cover") {
      return {
        folder: "sopify_covers",
        resource_type: "image",
      };
    }
  },
});

const upload = multer({ storage });

// ✅ Use fields instead of single()
router.post("/upload", upload.fields([{ name: "song" }, { name: "cover" }]), async (req, res) => {
  try {
    const { title, artist, genre, duration } = req.body;
    const songFile = req.files["song"] ? req.files["song"][0] : null;
    const coverFile = req.files["cover"] ? req.files["cover"][0] : null;

    if (!songFile || !coverFile) {
      return res.status(400).json({ error: "Both song and cover files are required" });
    }

    const newSong = new Song({
      title,
      artist,
      genre,
      duration,
      url: songFile.path, // song URL
      cover: coverFile.path, // image URL
    });

    await newSong.save();
    res.json({ success: true, song: newSong });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});
// Get all songs
router.get("/", async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: songs.length,
      songs,
    });
  } catch (err) {
    console.error("Get Songs Error:", err);
    res.status(500).json({ error: "Failed to fetch songs." });
  }
});

export default router;
