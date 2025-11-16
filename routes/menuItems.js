// routes/menuItems.js
const express = require('express');
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Multer disk storage for banner images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'menu-items');
    fs.mkdir(uploadPath, { recursive: true })
      .then(() => cb(null, uploadPath))
      .catch(err => cb(err));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// GET /menu-items - Get menu items (public, can filter by category, subcategory, route)
router.get('/', async (req, res) => {
  try {
    const { menuCategory, subcategory, route, isActive } = req.query;

    const query = {};
    if (menuCategory) query.menuCategory = menuCategory;
    if (subcategory) query.subcategory = subcategory;
    if (route) query.route = route;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const items = await MenuItem.find(query)
      .sort({ position: 1 })
      .select('-__v');

    res.status(200).json({
      items,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
});

// GET /menu-items/all - Get all menu items including inactive (admin)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const items = await MenuItem.find()
      .sort({ menuCategory: 1, subcategory: 1, position: 1 })
      .select('-__v');

    res.status(200).json({
      items,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
});

// GET /menu-items/:id - Get single menu item
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid menu item ID' });
    }

    const item = await MenuItem.findById(id).select('-__v');

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.status(200).json({ item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch menu item' });
  }
});

// GET /menu-items/route/:route - Get menu items by route and name (for page rendering)
router.get('/route/:route', async (req, res) => {
  try {
    const { route } = req.params;
    const { type } = req.query; // type is the name of the menu item

    const query = { route, isActive: true };
    if (type) {
      query.name = decodeURIComponent(type);
    }

    const items = await MenuItem.find(query)
      .sort({ position: 1 })
      .select('-__v');

    res.status(200).json({
      items,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
});

// POST /menu-items - Create menu item (admin)
router.post('/', authenticateToken, upload.single('bannerImage'), async (req, res) => {
  try {
    const {
      menuCategory,
      subcategory,
      route,
      name,
      position,
      isActive,
      breadcrumbTitle,
      breadcrumbSubTitle,
      title,
      description,
      features,
      benefits,
      accordionItems,
      additionalContent,
      bannerImage,
    } = req.body;

    // Parse JSON strings if they come as strings
    const parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features || [];
    const parsedBenefits = typeof benefits === 'string' ? JSON.parse(benefits) : benefits || [];
    const parsedAccordionItems = typeof accordionItems === 'string' ? JSON.parse(accordionItems) : accordionItems || [];

    const pageContent = {
      bannerImage: req.file ? req.file.path : bannerImage || '',
      breadcrumbTitle: breadcrumbTitle || title || name,
      breadcrumbSubTitle: breadcrumbSubTitle || '',
      title: title || name,
      description: description || '',
      features: parsedFeatures,
      benefits: parsedBenefits,
      accordionItems: parsedAccordionItems,
      additionalContent: additionalContent || '',
    };

    const newItem = new MenuItem({
      menuCategory,
      subcategory,
      route,
      name,
      position: Number(position) || 0,
      isActive: isActive !== undefined ? isActive : true,
      pageContent,
    });

    await newItem.save();

    res.status(201).json({
      message: 'Menu item created successfully',
      item: newItem,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create menu item', error: error.message });
  }
});

// PUT /menu-items/:id - Update menu item (admin)
router.put('/:id', authenticateToken, upload.single('bannerImage'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid menu item ID' });
    }

    const {
      menuCategory,
      subcategory,
      route,
      name,
      position,
      isActive,
      breadcrumbTitle,
      breadcrumbSubTitle,
      title,
      description,
      features,
      benefits,
      accordionItems,
      additionalContent,
      bannerImage,
    } = req.body;

    const updateData = {};
    if (menuCategory !== undefined) updateData.menuCategory = menuCategory;
    if (subcategory !== undefined) updateData.subcategory = subcategory;
    if (route !== undefined) updateData.route = route;
    if (name !== undefined) updateData.name = name;
    if (position !== undefined) updateData.position = Number(position);
    if (isActive !== undefined) updateData.isActive = isActive;

    // Parse JSON strings if they come as strings
    const parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;
    const parsedBenefits = typeof benefits === 'string' ? JSON.parse(benefits) : benefits;
    const parsedAccordionItems = typeof accordionItems === 'string' ? JSON.parse(accordionItems) : accordionItems;

    if (breadcrumbTitle !== undefined || breadcrumbSubTitle !== undefined || title !== undefined ||
        description !== undefined || parsedFeatures !== undefined || parsedBenefits !== undefined ||
        parsedAccordionItems !== undefined || additionalContent !== undefined || req.file || bannerImage !== undefined) {
      const existingItem = await MenuItem.findById(id);
      const existingPageContent = existingItem ? existingItem.pageContent : {};

      updateData.pageContent = {
        bannerImage: req.file ? req.file.path : (bannerImage !== undefined ? bannerImage : existingPageContent.bannerImage || ''),
        breadcrumbTitle: breadcrumbTitle !== undefined ? breadcrumbTitle : existingPageContent.breadcrumbTitle || '',
        breadcrumbSubTitle: breadcrumbSubTitle !== undefined ? breadcrumbSubTitle : existingPageContent.breadcrumbSubTitle || '',
        title: title !== undefined ? title : existingPageContent.title || '',
        description: description !== undefined ? description : existingPageContent.description || '',
        features: parsedFeatures !== undefined ? parsedFeatures : existingPageContent.features || [],
        benefits: parsedBenefits !== undefined ? parsedBenefits : existingPageContent.benefits || [],
        accordionItems: parsedAccordionItems !== undefined ? parsedAccordionItems : existingPageContent.accordionItems || [],
        additionalContent: additionalContent !== undefined ? additionalContent : existingPageContent.additionalContent || '',
      };
    }

    const item = await MenuItem.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.status(200).json({
      message: 'Menu item updated successfully',
      item,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update menu item', error: error.message });
  }
});

// DELETE /menu-items/:id - Delete menu item (admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid menu item ID' });
    }

    const item = await MenuItem.findByIdAndDelete(id);

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete menu item' });
  }
});

module.exports = router;

