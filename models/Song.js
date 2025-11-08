import mongoose from "mongoose";

const SongSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  url: { type: String, required: true }, // Cloudinary song URL
  cover: { type: String, required: true }, // Cloudinary image URL
  genre: { type: String },
  duration: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Song", SongSchema);
