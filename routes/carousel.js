// routes/carousel.js
const express = require('express');
const mongoose = require('mongoose');
const Carousel = require('../models/Carousel');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Multer disk storage for local uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'carousel');
    fs.mkdir(uploadPath, { recursive: true })
      .then(() => cb(null, uploadPath))
      .catch(err => cb(err));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// POST /carousel - Create carousel item
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, description, buttonTitle, link } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const newCarousel = new Carousel({
      title,
      description,
      buttonTitle,
      link,
      image: req.file.path
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

// GET /carousel - Fetch paginated carousel items
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const carouselItems = await Carousel.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalCount = await Carousel.countDocuments(query);

    res.status(200).json({
      carouselItems,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch carousel items' });
  }
});

// GET /carousel/:id - Fetch single carousel item
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid carousel item ID' });
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

// PUT /carousel/:id - Update carousel item
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, buttonTitle, link } = req.body;

    const carousel = await Carousel.findById(id);
    if (!carousel) {
      return res.status(404).json({ message: 'Carousel item not found' });
    }

    const updateData = {
      title,
      description,
      buttonTitle,
      link
    };

    if (req.file) {
      // Delete old image if it exists
      if (carousel.image) {
        await fs.unlink(carousel.image).catch(console.error);
      }
      updateData.image = req.file.path;
    }

    const updatedCarousel = await Carousel.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({ 
      message: 'Carousel item updated successfully', 
      carousel: updatedCarousel 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update carousel item' });
  }
});

// DELETE /carousel/:id - Delete carousel item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const carousel = await Carousel.findById(req.params.id);
    if (!carousel) {
      return res.status(404).json({ message: 'Carousel item not found' });
    }

    // Delete image file if it exists
    if (carousel.image) {
      await fs.unlink(carousel.image).catch(console.error);
    }

    await Carousel.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Carousel item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete carousel item' });
  }
});

module.exports = router;

