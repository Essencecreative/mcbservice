const express = require('express');
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { buildImageUrl } = require('../utils/imageUrl');

const router = express.Router();

/* -------------------------------
   Multer Storage for banner images
--------------------------------*/
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadPath = path.join(__dirname, '..', 'uploads', 'menu-items');
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
   Helper: Build public banner image URL
--------------------------------*/
const buildBannerUrl = (req, filename) => {
  return buildImageUrl(req, `uploads/menu-items/${filename}`);
};

/* -------------------------------
   GET /menu-items - List menu items (public)
--------------------------------*/
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

    res.status(200).json({ items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
});

/* -------------------------------
   GET /menu-items/all - Admin: all menu items with pagination
--------------------------------*/
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'position', sortOrder = 'asc' } = req.query;
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const items = await MenuItem.find()
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-__v');

    const totalCount = await MenuItem.countDocuments();

    res.status(200).json({ 
      items,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
});

/* -------------------------------
   GET /menu-items/route/:route - Get menu items by route (public)
--------------------------------*/
router.get('/route/:route', async (req, res) => {
  try {
    let { route } = req.params;
    const { type } = req.query;
    const MenuCategory = require('../models/MenuCategory');

    // Decode the route and ensure it starts with /
    route = decodeURIComponent(route);
    if (!route.startsWith('/')) {
      route = '/' + route;
    }

    const query = {
      route: route,
      isActive: true
    };

    // If type is provided, filter by name
    if (type) {
      query.name = decodeURIComponent(type);
    }

    const items = await MenuItem.find(query)
      .sort({ position: 1 })
      .select('-__v');

    // Get subcategory banner image from menu category, or category banner if no subcategories
    let subcategoryBanner = null;
    if (items.length > 0) {
      const firstItem = items[0];
      const category = await MenuCategory.findOne({ 
        name: firstItem.menuCategory
      });
      
      if (category) {
        // First, try to find subcategory banner
        const subcategory = category.subcategories.find(sub => sub.route === route);
        if (subcategory && subcategory.bannerImage) {
          subcategoryBanner = subcategory.bannerImage;
        } 
        // If no subcategory banner and category has no subcategories (like Invest), use category banner
        else if (category.subcategories.length === 0 && category.bannerImage) {
          subcategoryBanner = category.bannerImage;
        }
      }
    }

    res.status(200).json({ items, subcategoryBanner });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch menu items by route', error: error.message });
  }
});

/* -------------------------------
   GET /menu-items/:id - Single menu item
--------------------------------*/
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid menu item ID' });

    const item = await MenuItem.findById(id).select('-__v');
    if (!item) return res.status(404).json({ message: 'Menu item not found' });

    res.status(200).json({ item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch menu item' });
  }
});

/* -------------------------------
   POST /menu-items - Create menu item
--------------------------------*/
router.post('/', authenticateToken, upload.single('bannerImage'), async (req, res) => {
  const uploadStartTime = Date.now();
  try {
    console.log('\n' + '='.repeat(80));
    console.log('📸 [MENU ITEM BANNER UPLOAD] POST /menu-items - Creating new menu item');
    console.log('─'.repeat(80));
    console.log('Request received at:', new Date().toISOString());
    console.log('User:', req.user ? { id: req.user.id || req.user.userId, username: req.user.username } : 'Not authenticated');

    const {
      menuCategory, subcategory, route, name, position, isActive,
      breadcrumbTitle, breadcrumbSubTitle, title, description,
      features, benefits, accordionItems, additionalContent
    } = req.body;

    if (req.file) {
      console.log('📁 [MENU ITEM BANNER UPLOAD] Banner image file received:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: `${(req.file.size / 1024).toFixed(2)} KB`,
        path: req.file.path
      });

      // Verify file exists
      try {
        await fs.access(req.file.path);
        console.log('✅ [MENU ITEM BANNER UPLOAD] File verified at path:', req.file.path);
      } catch (accessError) {
        console.error('❌ [MENU ITEM BANNER UPLOAD] Error: File does not exist at path:', req.file.path);
        throw new Error(`Uploaded file not found: ${accessError.message}`);
      }
    } else {
      console.log('ℹ️  [MENU ITEM BANNER UPLOAD] No banner image provided');
    }

    // Parse JSON fields if sent as strings
    const parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features || [];
    const parsedBenefits = typeof benefits === 'string' ? JSON.parse(benefits) : benefits || [];
    const parsedAccordionItems = typeof accordionItems === 'string' ? JSON.parse(accordionItems) : accordionItems || [];

    console.log('🔗 [MENU ITEM BANNER UPLOAD] Building banner URL...');
    const pageContent = {
      bannerImage: req.file ? buildBannerUrl(req, req.file.filename) : '',
      breadcrumbTitle: breadcrumbTitle || title || name || '',
      breadcrumbSubTitle: breadcrumbSubTitle || '',
      title: title || name || '',
      description: description || '',
      features: parsedFeatures,
      benefits: parsedBenefits,
      accordionItems: parsedAccordionItems,
      additionalContent: additionalContent || ''
    };

    if (req.file) {
      console.log('✅ [MENU ITEM BANNER UPLOAD] Banner URL built:', pageContent.bannerImage);
    }

    console.log('💾 [MENU ITEM BANNER UPLOAD] Creating menu item with data:', {
      menuCategory,
      subcategory,
      route,
      name,
      position
    });

    const newItem = new MenuItem({
      menuCategory,
      subcategory,
      route,
      name,
      position: Number(position) || 0,
      isActive: isActive !== undefined ? isActive : true,
      pageContent
    });

    await newItem.save();
    const uploadTime = Date.now() - uploadStartTime;

    console.log('✅ [MENU ITEM BANNER UPLOAD] Menu item created successfully');
    console.log('📊 [MENU ITEM BANNER UPLOAD] Upload completed in:', `${uploadTime}ms`);
    console.log('📝 [MENU ITEM BANNER UPLOAD] Menu Item ID:', newItem._id);
    console.log('='.repeat(80) + '\n');

    res.status(201).json({ message: 'Menu item created successfully', item: newItem });
  } catch (error) {
    const uploadTime = Date.now() - uploadStartTime;
    console.error('❌ [MENU ITEM BANNER UPLOAD] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      uploadTime: `${uploadTime}ms`,
      fileInfo: req.file ? {
        originalname: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path
      } : null
    });
    
    // Clean up uploaded file if it exists but there was an error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
        console.log('🧹 [MENU ITEM BANNER UPLOAD] Cleaned up file after error:', req.file.path);
      } catch (unlinkError) {
        console.error('❌ [MENU ITEM BANNER UPLOAD] Failed to clean up file:', unlinkError);
      }
    }
    
    console.log('='.repeat(80) + '\n');
    res.status(500).json({ message: 'Failed to create menu item', error: error.message });
  }
});

/* -------------------------------
   PUT /menu-items/:id - Update menu item
--------------------------------*/
router.put('/:id', authenticateToken, upload.single('bannerImage'), async (req, res) => {
  const uploadStartTime = Date.now();
  try {
    const { id } = req.params;

    console.log('\n' + '='.repeat(80));
    console.log('📸 [MENU ITEM BANNER UPLOAD] PUT /menu-items/:id - Updating menu item');
    console.log('─'.repeat(80));
    console.log('Request received at:', new Date().toISOString());
    console.log('Menu Item ID:', id);
    console.log('User:', req.user ? { id: req.user.id || req.user.userId, username: req.user.username } : 'Not authenticated');

    if (!mongoose.isValidObjectId(id)) {
      console.error('❌ [MENU ITEM BANNER UPLOAD] Error: Invalid menu item ID format');
      return res.status(400).json({ message: 'Invalid menu item ID' });
    }

    const item = await MenuItem.findById(id);
    if (!item) {
      console.error('❌ [MENU ITEM BANNER UPLOAD] Error: Menu item not found');
      return res.status(404).json({ message: 'Menu item not found' });
    }

    console.log('✅ [MENU ITEM BANNER UPLOAD] Menu item found');

    const {
      menuCategory, subcategory, route, name, position, isActive,
      breadcrumbTitle, breadcrumbSubTitle, title, description,
      features, benefits, accordionItems, additionalContent, bannerImage
    } = req.body;

    if (req.file) {
      console.log('📁 [MENU ITEM BANNER UPLOAD] New banner image file received:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: `${(req.file.size / 1024).toFixed(2)} KB`,
        path: req.file.path
      });

      // Delete old banner if exists
      if (item.pageContent && item.pageContent.bannerImage) {
        const oldBannerPath = path.join(
          __dirname,
          '..',
          'uploads',
          'menu-items',
          path.basename(item.pageContent.bannerImage)
        );
        console.log('🗑️  [MENU ITEM BANNER UPLOAD] Deleting old banner:', oldBannerPath);
        try {
          await fs.unlink(oldBannerPath);
          console.log('✅ [MENU ITEM BANNER UPLOAD] Old banner deleted successfully');
        } catch (unlinkError) {
          console.warn('⚠️  [MENU ITEM BANNER UPLOAD] Could not delete old banner (may not exist):', unlinkError.message);
        }
      }

      // Verify new file exists
      try {
        await fs.access(req.file.path);
        console.log('✅ [MENU ITEM BANNER UPLOAD] New file verified at path:', req.file.path);
      } catch (accessError) {
        console.error('❌ [MENU ITEM BANNER UPLOAD] Error: New file does not exist at path:', req.file.path);
        throw new Error(`Uploaded file not found: ${accessError.message}`);
      }
    } else {
      console.log('ℹ️  [MENU ITEM BANNER UPLOAD] No new banner image provided, keeping existing banner');
    }

    const updateData = {};
    if (menuCategory !== undefined) updateData.menuCategory = menuCategory;
    if (subcategory !== undefined) updateData.subcategory = subcategory;
    if (route !== undefined) updateData.route = route;
    if (name !== undefined) updateData.name = name;
    if (position !== undefined) updateData.position = Number(position);
    if (isActive !== undefined) updateData.isActive = isActive;

    // Parse JSON fields if sent as strings
    const parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;
    const parsedBenefits = typeof benefits === 'string' ? JSON.parse(benefits) : benefits;
    const parsedAccordionItems = typeof accordionItems === 'string' ? JSON.parse(accordionItems) : accordionItems;

    console.log('🔗 [MENU ITEM BANNER UPLOAD] Building banner URL...');
    // Handle bannerImage: prioritize new file upload, then body bannerImage (URL string), then keep existing
    let bannerImageValue = item.pageContent?.bannerImage || '';
    if (req.file) {
      // New file uploaded - use it
      bannerImageValue = buildBannerUrl(req, req.file.filename);
      console.log('✅ [MENU ITEM BANNER UPLOAD] Using new uploaded file');
    } else if (bannerImage !== undefined && bannerImage !== '') {
      // bannerImage provided in body as URL string (existing or new URL)
      bannerImageValue = bannerImage;
      console.log('✅ [MENU ITEM BANNER UPLOAD] Using bannerImage from body:', bannerImageValue);
    } else {
      // Keep existing banner image
      console.log('ℹ️  [MENU ITEM BANNER UPLOAD] Keeping existing banner image');
    }
    
    updateData.pageContent = {
      bannerImage: bannerImageValue,
      breadcrumbTitle: breadcrumbTitle !== undefined ? breadcrumbTitle : item.pageContent.breadcrumbTitle,
      breadcrumbSubTitle: breadcrumbSubTitle !== undefined ? breadcrumbSubTitle : item.pageContent.breadcrumbSubTitle,
      title: title !== undefined ? title : item.pageContent.title,
      description: description !== undefined ? description : item.pageContent.description,
      features: parsedFeatures !== undefined ? parsedFeatures : item.pageContent.features,
      benefits: parsedBenefits !== undefined ? parsedBenefits : item.pageContent.benefits,
      accordionItems: parsedAccordionItems !== undefined ? parsedAccordionItems : item.pageContent.accordionItems,
      additionalContent: additionalContent !== undefined ? additionalContent : item.pageContent.additionalContent
    };

    if (req.file) {
      console.log('✅ [MENU ITEM BANNER UPLOAD] New banner URL built:', updateData.pageContent.bannerImage);
    }

    console.log('💾 [MENU ITEM BANNER UPLOAD] Updating menu item...');
    const updatedItem = await MenuItem.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true }).select('-__v');

    const uploadTime = Date.now() - uploadStartTime;
    console.log('✅ [MENU ITEM BANNER UPLOAD] Menu item updated successfully');
    console.log('📊 [MENU ITEM BANNER UPLOAD] Update completed in:', `${uploadTime}ms`);
    console.log('='.repeat(80) + '\n');

    res.status(200).json({ message: 'Menu item updated successfully', item: updatedItem });
  } catch (error) {
    const uploadTime = Date.now() - uploadStartTime;
    console.error('❌ [MENU ITEM BANNER UPLOAD] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      uploadTime: `${uploadTime}ms`,
      fileInfo: req.file ? {
        originalname: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path
      } : null
    });
    
    // Clean up uploaded file if it exists but there was an error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
        console.log('🧹 [MENU ITEM BANNER UPLOAD] Cleaned up file after error:', req.file.path);
      } catch (unlinkError) {
        console.error('❌ [MENU ITEM BANNER UPLOAD] Failed to clean up file:', unlinkError);
      }
    }
    
    console.log('='.repeat(80) + '\n');
    res.status(500).json({ message: 'Failed to update menu item', error: error.message });
  }
});

/* -------------------------------
   DELETE /menu-items/:id
--------------------------------*/
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid menu item ID' });

    const item = await MenuItem.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });

    res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete menu item' });
  }
});

module.exports = router;
