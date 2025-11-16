// routes/investorCategories.js
const express = require('express');
const mongoose = require('mongoose');
const InvestorCategory = require('../models/InvestorCategory');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Multer disk storage for local uploads (for PDF files)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'investor-categories');
    fs.mkdir(uploadPath, { recursive: true })
      .then(() => cb(null, uploadPath))
      .catch(err => cb(err));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// POST /investor-categories - Create investor category item
router.post('/', authenticateToken, upload.single('pdf'), async (req, res) => {
  try {
    const { category, title, description, pdfUrl } = req.body;

    const newItem = new InvestorCategory({
      category,
      title,
      description,
      pdfUrl: req.file ? req.file.path : pdfUrl || '', // Use uploaded file path or provided URL
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

// GET /investor-categories - Fetch paginated investor category items
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (category) {
      query.category = category;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const items = await InvestorCategory.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalCount = await InvestorCategory.countDocuments(query);

    res.status(200).json({
      items,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch investor category items' });
  }
});

// GET /investor-categories/:id - Fetch single investor category item
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid investor category item ID' });
    }

    const item = await InvestorCategory.findById(id);

    if (!item) {
      return res.status(404).json({ message: 'Investor category item not found' });
    }

    res.status(200).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch investor category item' });
  }
});

// PUT /investor-categories/:id - Update investor category item
router.put('/:id', authenticateToken, upload.single('pdf'), async (req, res) => {
  try {
    const { id } = req.params;
    const { category, title, description, pdfUrl } = req.body;

    const item = await InvestorCategory.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Investor category item not found' });
    }

    const updateData = {
      category,
      title,
      description,
    };

    if (req.file) {
      // Delete old PDF if it exists
      if (item.pdfUrl && !item.pdfUrl.startsWith('http')) {
        await fs.unlink(item.pdfUrl).catch(console.error);
      }
      updateData.pdfUrl = req.file.path;
    } else if (pdfUrl !== undefined) {
      // If pdfUrl is provided but no file, use the URL
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

// DELETE /investor-categories/:id - Delete investor category item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await InvestorCategory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Investor category item not found' });
    }

    // Delete PDF file if it exists and is a local file
    if (item.pdfUrl && !item.pdfUrl.startsWith('http')) {
      await fs.unlink(item.pdfUrl).catch(console.error);
    }

    await InvestorCategory.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Investor category item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete investor category item' });
  }
});

module.exports = router;

