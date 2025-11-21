// routes/investorNews.js
const express = require('express');
const mongoose = require('mongoose');
const InvestorNews = require('../models/InvestorNews');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

/* -------------------------------
   Multer Storage for images
--------------------------------*/
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadPath = path.join(__dirname, '..', 'uploads', 'investor-news');
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
   Helper: Build public image URL
--------------------------------*/
const buildImageUrl = (req, filename) => {
  return `${req.protocol}://${req.get('host')}/uploads/investor-news/${filename}`;
};

/* -------------------------------
   POST /investor-news - Create
--------------------------------*/
router.post('/', authenticateToken, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'bannerPhoto', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, shortDescription, content, publishedDate } = req.body;

    if (!req.files || !req.files['image'] || req.files['image'].length === 0) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const imageUrl = buildImageUrl(req, req.files['image'][0].filename);
    let bannerPhotoUrl = null;
    
    if (req.files['bannerPhoto'] && req.files['bannerPhoto'].length > 0) {
      bannerPhotoUrl = buildImageUrl(req, req.files['bannerPhoto'][0].filename);
    }

    const newInvestorNews = new InvestorNews({
      title,
      shortDescription,
      content,
      image: imageUrl,
      bannerPhoto: bannerPhotoUrl,
      publishedDate: publishedDate ? new Date(publishedDate) : new Date()
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

/* -------------------------------
   GET /investor-news - List (paginated)
--------------------------------*/
router.get('/', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'publishedDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const totalCount = await InvestorNews.countDocuments();

    // Sort by publishedDate (newest first), fallback to createdAt if publishedDate doesn't exist
    const investorNews = await InvestorNews.find()
      .sort({ 
        publishedDate: -1,
        createdAt: -1 
      })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      investorNews,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch investor news' });
  }
});

/* -------------------------------
   GET /investor-news/:id - Single
--------------------------------*/
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid investor news ID' });
    }

    const investorNews = await InvestorNews.findById(id);
    if (!investorNews) return res.status(404).json({ message: 'Investor news not found' });

    res.status(200).json(investorNews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch investor news' });
  }
});

/* -------------------------------
   PUT /investor-news/:id - Update
--------------------------------*/
router.put('/:id', authenticateToken, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'bannerPhoto', maxCount: 1 }]), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, shortDescription, content, publishedDate } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid investor news ID' });
    }

    const investorNews = await InvestorNews.findById(id);
    if (!investorNews) return res.status(404).json({ message: 'Investor news not found' });

    const updateData = { title, shortDescription, content };
    
    if (publishedDate) {
      updateData.publishedDate = new Date(publishedDate);
    }

    if (req.files && req.files['image'] && req.files['image'].length > 0) {
      // Delete old image if it exists
      if (investorNews.image && !investorNews.image.startsWith('http')) {
        const oldPath = path.join(__dirname, '..', 'uploads', 'investor-news', path.basename(investorNews.image));
        await fs.unlink(oldPath).catch(() => {});
      }
      updateData.image = buildImageUrl(req, req.files['image'][0].filename);
    }

    if (req.files && req.files['bannerPhoto'] && req.files['bannerPhoto'].length > 0) {
      // Delete old banner photo if it exists
      if (investorNews.bannerPhoto && !investorNews.bannerPhoto.startsWith('http')) {
        const oldPath = path.join(__dirname, '..', 'uploads', 'investor-news', path.basename(investorNews.bannerPhoto));
        await fs.unlink(oldPath).catch(() => {});
      }
      updateData.bannerPhoto = buildImageUrl(req, req.files['bannerPhoto'][0].filename);
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

/* -------------------------------
   DELETE /investor-news/:id
--------------------------------*/
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const investorNews = await InvestorNews.findById(id);
    if (!investorNews) return res.status(404).json({ message: 'Investor news not found' });

    // Delete old image if exists
    if (investorNews.image && !investorNews.image.startsWith('http')) {
      const oldPath = path.join(__dirname, '..', 'uploads', 'investor-news', path.basename(investorNews.image));
      await fs.unlink(oldPath).catch(() => {});
    }

    // Delete old banner photo if exists
    if (investorNews.bannerPhoto && !investorNews.bannerPhoto.startsWith('http')) {
      const oldPath = path.join(__dirname, '..', 'uploads', 'investor-news', path.basename(investorNews.bannerPhoto));
      await fs.unlink(oldPath).catch(() => {});
    }

    await InvestorNews.findByIdAndDelete(id);

    res.status(200).json({ message: 'Investor news deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete investor news' });
  }
});

module.exports = router;
