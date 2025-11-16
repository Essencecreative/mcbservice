// routes/carousel.js
const express = require('express');
const mongoose = require('mongoose');
const Carousel = require('../models/Carousel');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

/* -------------------------------
   1. Multer Storage (Uploads)
--------------------------------*/
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadPath = path.join(__dirname, '..', 'uploads', 'carousel');
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (err) {
      cb(err);
    }
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

/* -------------------------------
   Helper: Build Public Image URL
--------------------------------*/
function buildImageUrl(req, filename) {
  return `${req.protocol}://${req.get('host')}/uploads/carousel/${filename}`;
}

/* -------------------------------
   POST /carousel (Create)
--------------------------------*/
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const imageUrl = buildImageUrl(req, req.file.filename);

    const newCarousel = new Carousel({
      title: req.body.title,
      description: req.body.description,
      buttonTitle: req.body.buttonTitle,
      link: req.body.link,
      image: imageUrl
    });

    await newCarousel.save();

    res.status(201).json({
      message: 'Carousel item created successfully',
      carousel: newCarousel
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create carousel item' });
  }
});

/* -------------------------------
   GET /carousel (List + Pagination)
--------------------------------*/
router.get('/', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const totalCount = await Carousel.countDocuments();

    const carouselItems = await Carousel.find()
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      carouselItems,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch carousel items' });
  }
});

/* -------------------------------
   GET /carousel/:id
--------------------------------*/
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const carousel = await Carousel.findById(id);

    if (!carousel) {
      return res.status(404).json({ message: 'Carousel item not found' });
    }

    res.status(200).json(carousel);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch carousel item' });
  }
});

/* -------------------------------
   PUT /carousel/:id (Update)
--------------------------------*/
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const carousel = await Carousel.findById(id);

    if (!carousel) {
      return res.status(404).json({ message: 'Carousel item not found' });
    }

    const updateData = {
      title: req.body.title,
      description: req.body.description,
      buttonTitle: req.body.buttonTitle,
      link: req.body.link
    };

    if (req.file) {
      // Delete old file
      if (carousel.image) {
        const oldPath = path.join(
          __dirname,
          '..',
          'uploads',
          'carousel',
          path.basename(carousel.image)
        );

        await fs.unlink(oldPath).catch(() => {});
      }

      updateData.image = buildImageUrl(req, req.file.filename);
    }

    const updatedCarousel = await Carousel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    res.status(200).json({
      message: 'Carousel item updated successfully',
      carousel: updatedCarousel
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update carousel item' });
  }
});

/* -------------------------------
   DELETE /carousel/:id
--------------------------------*/
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const carousel = await Carousel.findById(req.params.id);

    if (!carousel) {
      return res.status(404).json({ message: 'Carousel item not found' });
    }

    // Delete file from disk
    if (carousel.image) {
      const oldPath = path.join(
        __dirname,
        '..',
        'uploads',
        'carousel',
        path.basename(carousel.image)
      );

      await fs.unlink(oldPath).catch(() => {});
    }

    await Carousel.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Carousel item deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete carousel item' });
  }
});

module.exports = router;
