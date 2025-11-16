// routes/investorNews.js
const express = require('express');
const mongoose = require('mongoose');
const InvestorNews = require('../models/InvestorNews');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Multer disk storage for local uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'investor-news');
    fs.mkdir(uploadPath, { recursive: true })
      .then(() => cb(null, uploadPath))
      .catch(err => cb(err));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// POST /investor-news - Create investor news
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, shortDescription, content } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const newInvestorNews = new InvestorNews({
      title,
      shortDescription,
      content,
      image: req.file.path
    });

    await newInvestorNews.save();

    res.status(201).json({ 
      message: 'Investor news created successfully', 
      investorNews: newInvestorNews 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create investor news' });
  }
});

// GET /investor-news - Fetch paginated investor news
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

    const investorNews = await InvestorNews.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalCount = await InvestorNews.countDocuments(query);

    res.status(200).json({
      investorNews,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch investor news' });
  }
});

// GET /investor-news/:id - Fetch single investor news
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid investor news ID' });
    }

    const investorNews = await InvestorNews.findById(id);

    if (!investorNews) {
      return res.status(404).json({ message: 'Investor news not found' });
    }

    res.status(200).json(investorNews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch investor news' });
  }
});

// PUT /investor-news/:id - Update investor news
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, shortDescription, content } = req.body;

    const investorNews = await InvestorNews.findById(id);
    if (!investorNews) {
      return res.status(404).json({ message: 'Investor news not found' });
    }

    const updateData = {
      title,
      shortDescription,
      content
    };

    if (req.file) {
      // Delete old image if it exists
      if (investorNews.image) {
        await fs.unlink(investorNews.image).catch(console.error);
      }
      updateData.image = req.file.path;
    }

    const updatedInvestorNews = await InvestorNews.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({ 
      message: 'Investor news updated successfully', 
      investorNews: updatedInvestorNews 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update investor news' });
  }
});

// DELETE /investor-news/:id - Delete investor news
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const investorNews = await InvestorNews.findById(req.params.id);
    if (!investorNews) {
      return res.status(404).json({ message: 'Investor news not found' });
    }

    // Delete image file if it exists
    if (investorNews.image) {
      await fs.unlink(investorNews.image).catch(console.error);
    }

    await InvestorNews.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Investor news deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete investor news' });
  }
});

module.exports = router;

