const express = require('express');
const mongoose = require('mongoose');
const NewsAndUpdate = require('../models/NewsAndUpdate');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { buildImageUrl: buildImageUrlUtil, extractFilePath } = require('../utils/imageUrl');

const router = express.Router();

/* -------------------------------
   Multer Storage for image uploads
--------------------------------*/
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadPath = path.join(__dirname, '..', 'uploads', 'news-and-updates');
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
  return buildImageUrlUtil(req, `uploads/news-and-updates/${filename}`);
};

/* -------------------------------
   POST /news-and-updates - Create
--------------------------------*/
router.post('/', authenticateToken, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'bannerPhoto', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, shortDescription, content, publishedDate } = req.body;

    if (!req.files || !req.files['image'] || req.files['image'].length === 0) {
      return res.status(400).json({ message: 'Image is required' });
    }

    let bannerPhotoUrl = null;
    if (req.files['bannerPhoto'] && req.files['bannerPhoto'].length > 0) {
      bannerPhotoUrl = buildImageUrl(req, req.files['bannerPhoto'][0].filename);
    }

    const newNews = new NewsAndUpdate({
      title,
      shortDescription,
      content,
      image: buildImageUrl(req, req.files['image'][0].filename),
      bannerPhoto: bannerPhotoUrl,
      publishedDate: publishedDate ? new Date(publishedDate) : new Date()
    });

    await newNews.save();

    res.status(201).json({ message: 'News & Update created successfully', newsAndUpdate: newNews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create news & update' });
  }
});

/* -------------------------------
   GET /news-and-updates - List with pagination
--------------------------------*/
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'publishedDate', sortOrder = 'desc' } = req.query;

    // Sort by publishedDate (newest first), fallback to createdAt if publishedDate doesn't exist
    const sortOptions = { 
      publishedDate: -1,
      createdAt: -1 
    };
    const newsList = await NewsAndUpdate.find()
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalCount = await NewsAndUpdate.countDocuments();

    res.status(200).json({
      newsAndUpdates: newsList,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch news & updates' });
  }
});

/* -------------------------------
   GET /news-and-updates/:id - Single
--------------------------------*/
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid ID' });

    const news = await NewsAndUpdate.findById(id);
    if (!news) return res.status(404).json({ message: 'News & Update not found' });

    res.status(200).json(news);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch news & update' });
  }
});

/* -------------------------------
   PUT /news-and-updates/:id - Update
--------------------------------*/
router.put('/:id', authenticateToken, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'bannerPhoto', maxCount: 1 }]), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid ID' });

    const news = await NewsAndUpdate.findById(id);
    if (!news) return res.status(404).json({ message: 'News & Update not found' });

    const { title, shortDescription, content, publishedDate } = req.body;
    const updateData = { title, shortDescription, content };
    
    if (publishedDate) {
      updateData.publishedDate = new Date(publishedDate);
    }

    if (req.files && req.files['image'] && req.files['image'].length > 0) {
      // Delete old image if exists
      if (news.image) {
        const relativePath = extractFilePath(news.image, req);
        const oldPath = path.join(__dirname, '..', relativePath);
        await fs.unlink(oldPath).catch(() => {});
      }
      updateData.image = buildImageUrl(req, req.files['image'][0].filename);
    }

    if (req.files && req.files['bannerPhoto'] && req.files['bannerPhoto'].length > 0) {
      // Delete old banner photo if exists
      if (news.bannerPhoto) {
        const relativePath = extractFilePath(news.bannerPhoto, req);
        const oldPath = path.join(__dirname, '..', relativePath);
        await fs.unlink(oldPath).catch(() => {});
      }
      updateData.bannerPhoto = buildImageUrl(req, req.files['bannerPhoto'][0].filename);
    }

    const updatedNews = await NewsAndUpdate.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json({ message: 'News & Update updated successfully', newsAndUpdate: updatedNews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update news & update' });
  }
});

/* -------------------------------
   DELETE /news-and-updates/:id
--------------------------------*/
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid ID' });

    const news = await NewsAndUpdate.findById(id);
    if (!news) return res.status(404).json({ message: 'News & Update not found' });

    // Delete image if exists
    if (news.image) {
      const relativePath = extractFilePath(news.image, req);
      const oldPath = path.join(__dirname, '..', relativePath);
      await fs.unlink(oldPath).catch(() => {});
    }

    // Delete banner photo if exists
    if (news.bannerPhoto) {
      const relativePath = extractFilePath(news.bannerPhoto, req);
      const oldPath = path.join(__dirname, '..', relativePath);
      await fs.unlink(oldPath).catch(() => {});
    }

    await NewsAndUpdate.findByIdAndDelete(id);
    res.status(200).json({ message: 'News & Update deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete news & update' });
  }
});

module.exports = router;
