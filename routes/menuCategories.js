// routes/menuCategories.js
const express = require('express');
const mongoose = require('mongoose');
const MenuCategory = require('../models/MenuCategory');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { buildFileUrl } = require('../utils/imageUrl');

const router = express.Router();

/* -------------------------------
   Multer Storage for subcategory banner images
--------------------------------*/
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadPath = path.join(__dirname, '..', 'uploads', 'menu-categories');
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

// GET /menu-categories - Get all menu categories (public)
router.get('/', async (req, res) => {
  try {
    const categories = await MenuCategory.find({ isActive: true })
      .sort({ position: 1 })
      .select('-__v');

    res.status(200).json({
      categories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch menu categories' });
  }
});

// GET /menu-categories/all - Get all menu categories including inactive (admin) with pagination
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'position', sortOrder = 'asc' } = req.query;
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const categories = await MenuCategory.find()
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-__v');

    const totalCount = await MenuCategory.countDocuments();

    res.status(200).json({
      categories,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch menu categories' });
  }
});

// GET /menu-categories/:id - Get single menu category
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid menu category ID' });
    }

    const category = await MenuCategory.findById(id).select('-__v');

    if (!category) {
      return res.status(404).json({ message: 'Menu category not found' });
    }

    res.status(200).json({ category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch menu category' });
  }
});

// POST /menu-categories - Create menu category (admin)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, displayName, position, isActive, subcategories } = req.body;

    const newCategory = new MenuCategory({
      name,
      displayName,
      position,
      isActive: isActive !== undefined ? isActive : true,
      subcategories: subcategories || [],
    });

    await newCategory.save();

    res.status(201).json({
      message: 'Menu category created successfully',
      category: newCategory,
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Menu category name or position already exists' });
    }
    res.status(500).json({ message: 'Failed to create menu category' });
  }
});

// PUT /menu-categories/:id - Update menu category (admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, displayName, position, isActive, subcategories } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid menu category ID' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (position !== undefined) updateData.position = position;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (subcategories !== undefined) updateData.subcategories = subcategories;

    const category = await MenuCategory.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!category) {
      return res.status(404).json({ message: 'Menu category not found' });
    }

    res.status(200).json({
      message: 'Menu category updated successfully',
      category,
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Menu category name or position already exists' });
    }
    res.status(500).json({ message: 'Failed to update menu category' });
  }
});

// DELETE /menu-categories/:id - Delete menu category (admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid menu category ID' });
    }

    const category = await MenuCategory.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ message: 'Menu category not found' });
    }

    res.status(200).json({ message: 'Menu category deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete menu category' });
  }
});

// POST /menu-categories/upload-banner - Upload subcategory banner image (admin)
router.post('/upload-banner', authenticateToken, upload.single('bannerImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const bannerUrl = buildFileUrl(req, req.file.filename, 'menu-categories');

    res.status(200).json({
      message: 'Banner image uploaded successfully',
      bannerImage: bannerUrl,
      url: bannerUrl
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to upload banner image' });
  }
});

module.exports = router;

