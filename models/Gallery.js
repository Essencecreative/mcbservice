// models/Gallery.js
const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  photos: [{ type: String }], // Array of Cloudinary image URLs
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Gallery', gallerySchema);