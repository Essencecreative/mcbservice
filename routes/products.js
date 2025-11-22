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
  try {
    const { title, description, buttonText, buttonLink, features } = req.body;

    let parsedFeatures = [];
    if (features) {
      parsedFeatures = JSON.parse(features);
      if (parsedFeatures.length > 5) {
        return res.status(400).json({ message: 'Maximum 5 features allowed' });
      }
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const newProduct = new Product({
      title,
      description,
      buttonText,
      buttonLink,
      features: parsedFeatures,
      image: buildFileUrl(req, req.file.path)
    });

    await newProduct.save();

    res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (error) {
    console.error(error);
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
  try {
    const { id } = req.params;
    const { title, description, buttonText, buttonLink, features } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updateData = {
      title,
      description,
      buttonText,
      buttonLink
    };

    if (features) {
      const parsedFeatures = JSON.parse(features);
      if (parsedFeatures.length > 5) {
        return res.status(400).json({ message: 'Maximum 5 features allowed' });
      }
      updateData.features = parsedFeatures;
    }

    if (req.file) {
      // Delete old image file
      if (product.image) {
        const oldImagePath = path.join(__dirname, '..', 'uploads', 'products', path.basename(product.image));
        await fs.unlink(oldImagePath).catch(console.error);
      }
      updateData.image = buildFileUrl(req, req.file.path);
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    console.error(error);
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
