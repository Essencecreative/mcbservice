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
    const { name, displayName, position, isActive, subcategories, bannerImage } = req.body;

    const newCategory = new MenuCategory({
      name,
      displayName,
      position,
      isActive: isActive !== undefined ? isActive : true,
      bannerImage: bannerImage || '',
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
  const updateStartTime = Date.now();
  try {
    const { id } = req.params;
    const { name, displayName, position, isActive, subcategories, bannerImage } = req.body;

    console.log('\n' + '='.repeat(80));
    console.log('📝 [MENU CATEGORY UPDATE] PUT /menu-categories/:id - Updating menu category');
    console.log('─'.repeat(80));
    console.log('Request received at:', new Date().toISOString());
    console.log('Menu Category ID:', id);
    console.log('User:', req.user ? { id: req.user.id || req.user.userId, username: req.user.username } : 'Not authenticated');

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('❌ [MENU CATEGORY UPDATE] Error: Invalid menu category ID format');
      return res.status(400).json({ message: 'Invalid menu category ID' });
    }

    // Check if category exists
    const existingCategory = await MenuCategory.findById(id);
    if (!existingCategory) {
      console.error('❌ [MENU CATEGORY UPDATE] Error: Menu category not found');
      return res.status(404).json({ message: 'Menu category not found' });
    }

    console.log('✅ [MENU CATEGORY UPDATE] Menu category found:', {
      name: existingCategory.name,
      displayName: existingCategory.displayName,
      subcategoriesCount: existingCategory.subcategories?.length || 0
    });

    const updateData = {};
    if (name !== undefined) {
      updateData.name = name;
      console.log('📝 [MENU CATEGORY UPDATE] Updating name:', name);
    }
    if (displayName !== undefined) {
      updateData.displayName = displayName;
      console.log('📝 [MENU CATEGORY UPDATE] Updating displayName:', displayName);
    }
    if (position !== undefined) {
      updateData.position = position;
      console.log('📝 [MENU CATEGORY UPDATE] Updating position:', position);
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive;
      console.log('📝 [MENU CATEGORY UPDATE] Updating isActive:', isActive);
    }
    if (bannerImage !== undefined) {
      updateData.bannerImage = bannerImage;
      console.log('📝 [MENU CATEGORY UPDATE] Updating category bannerImage:', bannerImage ? (bannerImage.substring(0, 100) + '...') : 'empty');
    }
    
    if (subcategories !== undefined) {
      console.log('📝 [MENU CATEGORY UPDATE] Updating subcategories:', {
        count: subcategories.length,
        subcategories: subcategories.map((sub) => ({
          name: sub.name,
          displayName: sub.displayName,
          route: sub.route,
          hasBannerImage: !!sub.bannerImage,
          bannerImage: sub.bannerImage ? (sub.bannerImage.substring(0, 100) + '...') : null
        }))
      });

      // Validate subcategories before updating
      for (let i = 0; i < subcategories.length; i++) {
        const sub = subcategories[i];
        if (sub.bannerImage) {
          console.log(`📸 [MENU CATEGORY UPDATE] Subcategory ${i + 1} (${sub.name}) has banner image:`, {
            bannerImage: sub.bannerImage.substring(0, 150),
            isUrl: sub.bannerImage.startsWith('http'),
            isPath: sub.bannerImage.startsWith('uploads/')
          });
        }
      }

      updateData.subcategories = subcategories;
    }

    console.log('💾 [MENU CATEGORY UPDATE] Updating menu category in database...');
    const category = await MenuCategory.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!category) {
      console.error('❌ [MENU CATEGORY UPDATE] Error: Category not found after update');
      return res.status(404).json({ message: 'Menu category not found' });
    }

    const updateTime = Date.now() - updateStartTime;
    console.log('✅ [MENU CATEGORY UPDATE] Menu category updated successfully');
    console.log('📊 [MENU CATEGORY UPDATE] Update completed in:', `${updateTime}ms`);
    console.log('📝 [MENU CATEGORY UPDATE] Updated category:', {
      name: category.name,
      displayName: category.displayName,
      subcategoriesCount: category.subcategories?.length || 0
    });
    console.log('='.repeat(80) + '\n');

    res.status(200).json({
      message: 'Menu category updated successfully',
      category,
    });
  } catch (error) {
    const updateTime = Date.now() - updateStartTime;
    console.error('❌ [MENU CATEGORY UPDATE] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      updateTime: `${updateTime}ms`,
      requestBody: {
        name,
        displayName,
        position,
        isActive,
        subcategoriesCount: subcategories?.length || 0,
        subcategories: subcategories?.map((sub) => ({
          name: sub.name,
          hasBannerImage: !!sub.bannerImage
        })) || []
      }
    });

    if (error.code === 11000) {
      console.error('❌ [MENU CATEGORY UPDATE] Duplicate key error - name or position already exists');
      console.log('='.repeat(80) + '\n');
      return res.status(400).json({ message: 'Menu category name or position already exists' });
    }
    
    console.log('='.repeat(80) + '\n');
    res.status(500).json({ 
      message: 'Failed to update menu category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
  const uploadStartTime = Date.now();
  try {
    console.log('\n' + '='.repeat(80));
    console.log('📸 [SUBCATEGORY BANNER UPLOAD] POST /menu-categories/upload-banner - Uploading subcategory banner');
    console.log('─'.repeat(80));
    console.log('Request received at:', new Date().toISOString());
    console.log('User:', req.user ? { id: req.user.id || req.user.userId, username: req.user.username } : 'Not authenticated');
    console.log('Has File:', !!req.file);
    console.log('Request Body:', req.body);

    if (!req.file) {
      console.error('❌ [SUBCATEGORY BANNER UPLOAD] Error: No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('📁 [SUBCATEGORY BANNER UPLOAD] File received:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: `${(req.file.size / 1024).toFixed(2)} KB`,
      path: req.file.path
    });

    // Verify file exists
    try {
      await fs.access(req.file.path);
      console.log('✅ [SUBCATEGORY BANNER UPLOAD] File verified at path:', req.file.path);
    } catch (accessError) {
      console.error('❌ [SUBCATEGORY BANNER UPLOAD] Error: File does not exist at path:', req.file.path);
      console.error('❌ [SUBCATEGORY BANNER UPLOAD] Access error:', accessError);
      throw new Error(`Uploaded file not found: ${accessError.message}`);
    }

    console.log('🔗 [SUBCATEGORY BANNER UPLOAD] Building file URL...');
    const bannerUrl = buildFileUrl(req, req.file.filename, 'menu-categories');
    console.log('✅ [SUBCATEGORY BANNER UPLOAD] Banner URL built:', bannerUrl);

    const uploadTime = Date.now() - uploadStartTime;
    console.log('✅ [SUBCATEGORY BANNER UPLOAD] Banner image uploaded successfully');
    console.log('📊 [SUBCATEGORY BANNER UPLOAD] Upload completed in:', `${uploadTime}ms`);
    console.log('='.repeat(80) + '\n');

    res.status(200).json({
      message: 'Banner image uploaded successfully',
      bannerImage: bannerUrl,
      url: bannerUrl
    });
  } catch (error) {
    const uploadTime = Date.now() - uploadStartTime;
    console.error('❌ [SUBCATEGORY BANNER UPLOAD] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      uploadTime: `${uploadTime}ms`,
      fileInfo: req.file ? {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      } : null
    });
    
    // Clean up uploaded file if it exists but there was an error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
        console.log('🧹 [SUBCATEGORY BANNER UPLOAD] Cleaned up file after error:', req.file.path);
      } catch (unlinkError) {
        console.error('❌ [SUBCATEGORY BANNER UPLOAD] Failed to clean up file:', unlinkError);
      }
    }
    
    console.log('='.repeat(80) + '\n');
    res.status(500).json({ 
      message: 'Failed to upload banner image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

