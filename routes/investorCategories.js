// routes/investorCategories.js
const express = require('express');
const mongoose = require('mongoose');
const InvestorCategory = require('../models/InvestorCategory');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { buildImageUrl: buildImageUrlUtil } = require('../utils/imageUrl');

const router = express.Router();

/* -------------------------------
   Multer Storage for PDF uploads
--------------------------------*/
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadPath = path.join(__dirname, '..', 'uploads', 'investor-categories');
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
   Helper: Build Public PDF URL
--------------------------------*/
const buildPdfUrl = (req, filename) => {
  return buildImageUrlUtil(req, `uploads/investor-categories/${filename}`);
};

/* -------------------------------
   POST /investor-categories - Create
--------------------------------*/
router.post('/', authenticateToken, upload.single('pdf'), async (req, res) => {
  try {
    const { category, title, description, pdfUrl } = req.body;

    const finalPdfUrl = req.file
      ? buildPdfUrl(req, req.file.filename)
      : pdfUrl || '';

    const newItem = new InvestorCategory({
      category,
      title,
      description,
      pdfUrl: finalPdfUrl
    });

    await newItem.save();

    res.status(201).json({
      message: 'Investor category item created successfully',
      item: newItem
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create investor category item' });
  }
});

/* -------------------------------
   GET /investor-categories - List (paginated)
--------------------------------*/
router.get('/', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const category = req.query.category;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const query = {};
    if (category) query.category = category;

    const totalCount = await InvestorCategory.countDocuments(query);

    const items = await InvestorCategory.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      items,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch investor category items' });
  }
});

/* -------------------------------
   GET /investor-categories/:id - Single
--------------------------------*/
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid investor category item ID' });
    }

    const item = await InvestorCategory.findById(id);
    if (!item) return res.status(404).json({ message: 'Investor category item not found' });

    res.status(200).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch investor category item' });
  }
});

/* -------------------------------
   PUT /investor-categories/:id - Update
--------------------------------*/
router.put('/:id', authenticateToken, upload.single('pdf'), async (req, res) => {
  try {
    const { id } = req.params;
    const { category, title, description, pdfUrl } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid investor category item ID' });
    }

    const item = await InvestorCategory.findById(id);
    if (!item) return res.status(404).json({ message: 'Investor category item not found' });

    const updateData = {
      category,
      title,
      description
    };

    if (req.file) {
      // Delete old PDF if local
      if (item.pdfUrl && !item.pdfUrl.startsWith('http')) {
        const oldPath = path.join(__dirname, '..', 'uploads', 'investor-categories', path.basename(item.pdfUrl));
        await fs.unlink(oldPath).catch(() => {});
      }
      updateData.pdfUrl = buildPdfUrl(req, req.file.filename);
    } else if (pdfUrl !== undefined) {
      // Use provided URL if given
      updateData.pdfUrl = pdfUrl || '';
    }

    const updatedItem = await InvestorCategory.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({
      message: 'Investor category item updated successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update investor category item' });
  }
});

/* -------------------------------
   DELETE /investor-categories/:id
--------------------------------*/
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const item = await InvestorCategory.findById(id);
    if (!item) return res.status(404).json({ message: 'Investor category item not found' });

    // Delete local PDF if exists
    if (item.pdfUrl && !item.pdfUrl.startsWith('http')) {
      const oldPath = path.join(__dirname, '..', 'uploads', 'investor-categories', path.basename(item.pdfUrl));
      await fs.unlink(oldPath).catch(() => {});
    }

    await InvestorCategory.findByIdAndDelete(id);

    res.status(200).json({ message: 'Investor category item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete investor category item' });
  }
});

module.exports = router;
