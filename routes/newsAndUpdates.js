// routes/newsAndUpdates.js
const express = require('express');
const mongoose = require('mongoose');
const NewsAndUpdate = require('../models/NewsAndUpdate');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Multer disk storage for local uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'news-and-updates');
    fs.mkdir(uploadPath, { recursive: true })
      .then(() => cb(null, uploadPath))
      .catch(err => cb(err));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// POST /news-and-updates - Create news and update
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, shortDescription, content } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const newNewsAndUpdate = new NewsAndUpdate({
      title,
      shortDescription,
      content,
      image: req.file.path
    });

    await newNewsAndUpdate.save();

    res.status(201).json({ 
      message: 'News & Update created successfully', 
      newsAndUpdate: newNewsAndUpdate 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create news & update' });
  }
});

// GET /news-and-updates - Fetch paginated news and updates
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

    const newsAndUpdates = await NewsAndUpdate.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalCount = await NewsAndUpdate.countDocuments(query);

    res.status(200).json({
      newsAndUpdates,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch news & updates' });
  }
});

// GET /news-and-updates/:id - Fetch single news and update
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid news & update ID' });
    }

    const newsAndUpdate = await NewsAndUpdate.findById(id);

    if (!newsAndUpdate) {
      return res.status(404).json({ message: 'News & Update not found' });
    }

    res.status(200).json(newsAndUpdate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch news & update' });
  }
});

// PUT /news-and-updates/:id - Update news and update
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, shortDescription, content } = req.body;

    const newsAndUpdate = await NewsAndUpdate.findById(id);
    if (!newsAndUpdate) {
      return res.status(404).json({ message: 'News & Update not found' });
    }

    const updateData = {
      title,
      shortDescription,
      content
    };

    if (req.file) {
      // Delete old image if it exists
      if (newsAndUpdate.image) {
        await fs.unlink(newsAndUpdate.image).catch(console.error);
      }
      updateData.image = req.file.path;
    }

    const updatedNewsAndUpdate = await NewsAndUpdate.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({ 
      message: 'News & Update updated successfully', 
      newsAndUpdate: updatedNewsAndUpdate 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update news & update' });
  }
});

// DELETE /news-and-updates/:id - Delete news and update
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const newsAndUpdate = await NewsAndUpdate.findById(req.params.id);
    if (!newsAndUpdate) {
      return res.status(404).json({ message: 'News & Update not found' });
    }

    // Delete image file if it exists
    if (newsAndUpdate.image) {
      await fs.unlink(newsAndUpdate.image).catch(console.error);
    }

    await NewsAndUpdate.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'News & Update deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete news & update' });
  }
});

module.exports = router;

