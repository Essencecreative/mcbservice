// routes/menuCategories.js
const express = require('express');
const mongoose = require('mongoose');
const MenuCategory = require('../models/MenuCategory');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

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

// GET /menu-categories/all - Get all menu categories including inactive (admin)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const categories = await MenuCategory.find()
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

module.exports = router;

