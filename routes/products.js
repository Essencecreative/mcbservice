// routes/products.js
const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/product');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { buildImageUrl: buildImageUrlUtil } = require('../utils/imageUrl');

const router = express.Router();

// Multer disk storage for local uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'products');
    fs.mkdir(uploadPath, { recursive: true })
      .then(() => cb(null, uploadPath))
      .catch(err => cb(err));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Helper: build full URL for uploaded file
const buildFileUrl = (req, filename) => {
  return buildImageUrlUtil(req, `uploads/products/${path.basename(filename)}`);
};

// POST /products - Create product
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  const uploadStartTime = Date.now();
  try {
    console.log('\n' + '='.repeat(80));
    console.log('📸 [PRODUCT IMAGE UPLOAD] POST /products - Creating new product');
    console.log('─'.repeat(80));
    console.log('Request received at:', new Date().toISOString());
    console.log('User:', req.user ? { id: req.user.id || req.user.userId, username: req.user.username } : 'Not authenticated');

    const { title, description, buttonText, buttonLink, features } = req.body;

    let parsedFeatures = [];
    if (features) {
      parsedFeatures = JSON.parse(features);
      if (parsedFeatures.length > 5) {
        console.error('❌ [PRODUCT IMAGE UPLOAD] Error: Maximum 5 features allowed');
        return res.status(400).json({ message: 'Maximum 5 features allowed' });
      }
    }

    if (!req.file) {
      console.error('❌ [PRODUCT IMAGE UPLOAD] Error: No image file provided');
      return res.status(400).json({ message: 'Image is required' });
    }

    console.log('📁 [PRODUCT IMAGE UPLOAD] File received:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: `${(req.file.size / 1024).toFixed(2)} KB`,
      path: req.file.path
    });

    // Verify file exists
    try {
      await fs.access(req.file.path);
      console.log('✅ [PRODUCT IMAGE UPLOAD] File verified at path:', req.file.path);
    } catch (accessError) {
      console.error('❌ [PRODUCT IMAGE UPLOAD] Error: File does not exist at path:', req.file.path);
      throw new Error(`Uploaded file not found: ${accessError.message}`);
    }

    console.log('🔗 [PRODUCT IMAGE UPLOAD] Building image URL...');
    const imageUrl = buildFileUrl(req, req.file.path);
    console.log('✅ [PRODUCT IMAGE UPLOAD] Image URL built:', imageUrl);

    console.log('💾 [PRODUCT IMAGE UPLOAD] Creating product with data:', {
      title,
      description: description?.substring(0, 50) + '...',
      buttonText,
      buttonLink,
      featuresCount: parsedFeatures.length
    });

    const newProduct = new Product({
      title,
      description,
      buttonText,
      buttonLink,
      features: parsedFeatures,
      image: imageUrl
    });

    await newProduct.save();
    const uploadTime = Date.now() - uploadStartTime;

    console.log('✅ [PRODUCT IMAGE UPLOAD] Product created successfully');
    console.log('📊 [PRODUCT IMAGE UPLOAD] Upload completed in:', `${uploadTime}ms`);
    console.log('📝 [PRODUCT IMAGE UPLOAD] Product ID:', newProduct._id);
    console.log('='.repeat(80) + '\n');

    res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (error) {
    const uploadTime = Date.now() - uploadStartTime;
    console.error('❌ [PRODUCT IMAGE UPLOAD] Error details:', {
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
        console.log('🧹 [PRODUCT IMAGE UPLOAD] Cleaned up file after error:', req.file.path);
      } catch (unlinkError) {
        console.error('❌ [PRODUCT IMAGE UPLOAD] Failed to clean up file:', unlinkError);
      }
    }
    
    console.log('='.repeat(80) + '\n');
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// GET /products - Fetch paginated products
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalCount = await Product.countDocuments(query);

    res.status(200).json({
      products,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// GET /products/:id - Fetch single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// PUT /products/:id - Update product
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  const uploadStartTime = Date.now();
  try {
    const { id } = req.params;
    const { title, description, buttonText, buttonLink, features } = req.body;

    console.log('\n' + '='.repeat(80));
    console.log('📸 [PRODUCT IMAGE UPLOAD] PUT /products/:id - Updating product');
    console.log('─'.repeat(80));
    console.log('Request received at:', new Date().toISOString());
    console.log('Product ID:', id);
    console.log('User:', req.user ? { id: req.user.id || req.user.userId, username: req.user.username } : 'Not authenticated');

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('❌ [PRODUCT IMAGE UPLOAD] Error: Invalid product ID format');
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(id);
    if (!product) {
      console.error('❌ [PRODUCT IMAGE UPLOAD] Error: Product not found');
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('✅ [PRODUCT IMAGE UPLOAD] Product found');

    const updateData = {
      title,
      description,
      buttonText,
      buttonLink
    };

    if (features) {
      const parsedFeatures = JSON.parse(features);
      if (parsedFeatures.length > 5) {
        console.error('❌ [PRODUCT IMAGE UPLOAD] Error: Maximum 5 features allowed');
        return res.status(400).json({ message: 'Maximum 5 features allowed' });
      }
      updateData.features = parsedFeatures;
    }

    if (req.file) {
      console.log('📁 [PRODUCT IMAGE UPLOAD] New image file received:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: `${(req.file.size / 1024).toFixed(2)} KB`,
        path: req.file.path
      });

      // Delete old image file
      if (product.image) {
        const oldImagePath = path.join(__dirname, '..', 'uploads', 'products', path.basename(product.image));
        console.log('🗑️  [PRODUCT IMAGE UPLOAD] Deleting old image:', oldImagePath);
        try {
          await fs.unlink(oldImagePath);
          console.log('✅ [PRODUCT IMAGE UPLOAD] Old image deleted successfully');
        } catch (unlinkError) {
          console.warn('⚠️  [PRODUCT IMAGE UPLOAD] Could not delete old image (may not exist):', unlinkError.message);
        }
      }

      // Verify new file exists
      try {
        await fs.access(req.file.path);
        console.log('✅ [PRODUCT IMAGE UPLOAD] New file verified at path:', req.file.path);
      } catch (accessError) {
        console.error('❌ [PRODUCT IMAGE UPLOAD] Error: New file does not exist at path:', req.file.path);
        throw new Error(`Uploaded file not found: ${accessError.message}`);
      }

      console.log('🔗 [PRODUCT IMAGE UPLOAD] Building new image URL...');
      updateData.image = buildFileUrl(req, req.file.path);
      console.log('✅ [PRODUCT IMAGE UPLOAD] New image URL built:', updateData.image);
    } else {
      console.log('ℹ️  [PRODUCT IMAGE UPLOAD] No new image provided, keeping existing image');
    }

    console.log('💾 [PRODUCT IMAGE UPLOAD] Updating product...');
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });

    const uploadTime = Date.now() - uploadStartTime;
    console.log('✅ [PRODUCT IMAGE UPLOAD] Product updated successfully');
    console.log('📊 [PRODUCT IMAGE UPLOAD] Update completed in:', `${uploadTime}ms`);
    console.log('='.repeat(80) + '\n');

    res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    const uploadTime = Date.now() - uploadStartTime;
    console.error('❌ [PRODUCT IMAGE UPLOAD] Error details:', {
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
        console.log('🧹 [PRODUCT IMAGE UPLOAD] Cleaned up file after error:', req.file.path);
      } catch (unlinkError) {
        console.error('❌ [PRODUCT IMAGE UPLOAD] Failed to clean up file:', unlinkError);
      }
    }
    
    console.log('='.repeat(80) + '\n');
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// DELETE /products/:id - Delete product
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete image file
    if (product.image) {
      const imagePath = path.join(__dirname, '..', 'uploads', 'products', path.basename(product.image));
      await fs.unlink(imagePath).catch(console.error);
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

module.exports = router;
