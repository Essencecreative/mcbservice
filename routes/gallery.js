// routes/gallery.js
const express = require('express');
const mongoose = require('mongoose');
const Gallery = require('../models/Gallery');
const authenticateToken = require('../middlewares/authMiddleware');
const multerLib = require('multer');
const { v2: cloudinary } = require('cloudinary');
const path = require('path');

const router = express.Router();

// Multer memory storage
const storage = multerLib.memoryStorage();
const multer = multerLib({ storage });

// Accept multiple photos (up to 10 at once)
const upload = multer.fields([
  { name: 'photos', maxCount: 10 },
]);

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to upload a single image buffer to Cloudinary
const uploadImageToCloudinary = (buffer, originalName) => {
  return new Promise((resolve, reject) => {
    const fileExtension = path.extname(originalName);
    const fileName = path.basename(originalName, fileExtension);

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'gallery',
        public_id: `${Date.now()}_${fileName}`, // Unique name with timestamp
        overwrite: true,
      },
      (error, result) => {
        if (result) resolve(result.secure_url);
        else reject(error);
      }
    );
    stream.end(buffer);
  });
};

// CREATE: Upload multiple photos to gallery
router.post('/', authenticateToken, upload, async (req, res) => {
  try {
    const { title, description } = req.body;
    const photos = req.files['photos'] || [];

    if (photos.length === 0) {
      return res.status(400).json({ message: 'At least one photo is required' });
    }

    // Upload all photos in parallel
    const uploadPromises = photos.map((file) =>
      uploadImageToCloudinary(file.buffer, file.originalname)
    );

    const photoUrls = await Promise.all(uploadPromises);

    // Save to Gallery
    const newGallery = new Gallery({
      title,
      description,
      photos: photoUrls,
    });

    await newGallery.save();

    res.status(201).json({
      message: 'Gallery created successfully',
      gallery: newGallery,
    });
  } catch (error) {
    console.error('Gallery upload error:', error);
    res.status(500).json({ message: 'Failed to upload gallery images' });
  }
});

// GET: Fetch all galleries (with pagination)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const galleries = await Gallery.find()
      .sort({ uploadedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalCount = await Gallery.countDocuments();

    res.status(200).json({
      galleries,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch galleries' });
  }
});

// GET: Single gallery by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid gallery ID' });
    }

    const gallery = await Gallery.findById(id);

    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    res.status(200).json(gallery);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch gallery' });
  }
});

// DELETE: Remove a gallery (and optionally delete from Cloudinary later if needed)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedGallery = await Gallery.findByIdAndDelete(id);

    if (!deletedGallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    // Optional: Delete from Cloudinary using public_id
    // You can extract public_id from URL or store it in DB

    res.status(200).json({ message: 'Gallery deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete gallery' });
  }
});

module.exports = router;