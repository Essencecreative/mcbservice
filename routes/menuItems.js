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

    // Get subcategory banner image from menu category
    let subcategoryBanner = null;
    if (items.length > 0) {
      const firstItem = items[0];
      const category = await MenuCategory.findOne({ 
        name: firstItem.menuCategory,
        'subcategories.route': route
      });
      
      if (category) {
        const subcategory = category.subcategories.find(sub => sub.route === route);
        if (subcategory && subcategory.bannerImage) {
          subcategoryBanner = subcategory.bannerImage;
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
  try {
    const {
      menuCategory, subcategory, route, name, position, isActive,
      breadcrumbTitle, breadcrumbSubTitle, title, description,
      features, benefits, accordionItems, additionalContent
    } = req.body;

    // Parse JSON fields if sent as strings
    const parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features || [];
    const parsedBenefits = typeof benefits === 'string' ? JSON.parse(benefits) : benefits || [];
    const parsedAccordionItems = typeof accordionItems === 'string' ? JSON.parse(accordionItems) : accordionItems || [];

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

    res.status(201).json({ message: 'Menu item created successfully', item: newItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create menu item', error: error.message });
  }
});

/* -------------------------------
   PUT /menu-items/:id - Update menu item
--------------------------------*/
router.put('/:id', authenticateToken, upload.single('bannerImage'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid menu item ID' });

    const item = await MenuItem.findById(id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });

    const {
      menuCategory, subcategory, route, name, position, isActive,
      breadcrumbTitle, breadcrumbSubTitle, title, description,
      features, benefits, accordionItems, additionalContent
    } = req.body;

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

    updateData.pageContent = {
      bannerImage: req.file ? buildBannerUrl(req, req.file.filename) : item.pageContent.bannerImage,
      breadcrumbTitle: breadcrumbTitle !== undefined ? breadcrumbTitle : item.pageContent.breadcrumbTitle,
      breadcrumbSubTitle: breadcrumbSubTitle !== undefined ? breadcrumbSubTitle : item.pageContent.breadcrumbSubTitle,
      title: title !== undefined ? title : item.pageContent.title,
      description: description !== undefined ? description : item.pageContent.description,
      features: parsedFeatures !== undefined ? parsedFeatures : item.pageContent.features,
      benefits: parsedBenefits !== undefined ? parsedBenefits : item.pageContent.benefits,
      accordionItems: parsedAccordionItems !== undefined ? parsedAccordionItems : item.pageContent.accordionItems,
      additionalContent: additionalContent !== undefined ? additionalContent : item.pageContent.additionalContent
    };

    const updatedItem = await MenuItem.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true }).select('-__v');

    res.status(200).json({ message: 'Menu item updated successfully', item: updatedItem });
  } catch (error) {
    console.error(error);
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
