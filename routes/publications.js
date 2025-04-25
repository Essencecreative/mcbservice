const express = require('express');
const mongoose = require('mongoose');
const Publication = require('../models/Publication');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');

const router = express.Router();

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload helper
const streamUpload = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'publications',
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(fileBuffer);
  });
};

// Create a new publication with optional photo
router.post('/', authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      newsAndEvents,
      publicationDate,
      contentDescription,
    } = req.body;

    let photoUrl = "";
    if (req.file) {
      const uploadResult = await streamUpload(req.file.buffer);
      photoUrl = uploadResult.secure_url;
    }

    const newPublication = new Publication({
      title,
      category,
      description,
      newsAndEvents,
      publicationDate: new Date(publicationDate),
      contentDescription,
      photo: photoUrl,
    });

    await newPublication.save();

    res.status(200).json({
      message: 'Publication created successfully',
      publication: newPublication,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create publication' });
  }
});

// Fetch publications (with pagination and filtering)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      sortBy = 'publicationDate',
      sortOrder = 'desc',
    } = req.query;

    const query = {};
    if (category) {
      query.category = category;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const publications = await Publication.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalCount = await Publication.countDocuments(query);

    res.status(200).json({
      publications,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch publications' });
  }
});

// Update an existing publication (including new photo)
router.put('/:id', authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      description,
      newsAndEvents,
      publicationDate,
      contentDescription,
    } = req.body;

    const updateData = {
      title,
      category,
      description,
      newsAndEvents,
      publicationDate: new Date(publicationDate),
      contentDescription,
    };

    if (req.file) {
      const uploadResult = await streamUpload(req.file.buffer);
      updateData.photo = uploadResult.secure_url;
    }

    const updatedPublication = await Publication.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedPublication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    res.status(200).json({
      message: 'Publication updated successfully',
      publication: updatedPublication,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update publication' });
  }
});

// Delete a publication
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPublication = await Publication.findByIdAndDelete(id);

    if (!deletedPublication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    res.status(200).json({ message: 'Publication deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete publication' });
  }
});

// Get a single publication by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const publication = await Publication.findById(id);

    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    res.status(200).json(publication);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch publication' });
  }
});

module.exports = router;
