// routes/carousel.js
const express = require('express');
const mongoose = require('mongoose');
const Carousel = require('../models/Carousel');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { buildImageUrl: buildImageUrlUtil } = require('../utils/imageUrl');

const router = express.Router();

/* -------------------------------
   1. Multer Storage (Uploads)
--------------------------------*/
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadPath = path.join(__dirname, '..', 'uploads', 'carousel');
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
   Helper: Build Public Image URL
--------------------------------*/
function buildImageUrl(req, filename) {
  return buildImageUrlUtil(req, `uploads/carousel/${filename}`);
}

/* -------------------------------
   POST /carousel (Create)
--------------------------------*/
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  const uploadStartTime = Date.now();
  try {
    console.log('\n' + '='.repeat(80));
    console.log('📸 [CAROUSEL IMAGE UPLOAD] POST /carousel - Creating new carousel item');
    console.log('─'.repeat(80));
    console.log('Request received at:', new Date().toISOString());
    console.log('User:', req.user ? { id: req.user.id || req.user.userId, username: req.user.username } : 'Not authenticated');

    if (!req.file) {
      console.error('❌ [CAROUSEL IMAGE UPLOAD] Error: No image file provided');
      return res.status(400).json({ message: 'Image is required' });
    }

    console.log('📁 [CAROUSEL IMAGE UPLOAD] File received:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: `${(req.file.size / 1024).toFixed(2)} KB`,
      path: req.file.path
    });

    // Verify file exists
    try {
      await fs.access(req.file.path);
      console.log('✅ [CAROUSEL IMAGE UPLOAD] File verified at path:', req.file.path);
    } catch (accessError) {
      console.error('❌ [CAROUSEL IMAGE UPLOAD] Error: File does not exist at path:', req.file.path);
      throw new Error(`Uploaded file not found: ${accessError.message}`);
    }

    console.log('🔗 [CAROUSEL IMAGE UPLOAD] Building image URL...');
    const imageUrl = buildImageUrl(req, req.file.filename);
    console.log('✅ [CAROUSEL IMAGE UPLOAD] Image URL built:', imageUrl);

    console.log('💾 [CAROUSEL IMAGE UPLOAD] Creating carousel item with data:', {
      title: req.body.title,
      description: req.body.description?.substring(0, 50) + '...',
      buttonTitle: req.body.buttonTitle,
      link: req.body.link
    });

    const newCarousel = new Carousel({
      title: req.body.title,
      description: req.body.description,
      buttonTitle: req.body.buttonTitle,
      link: req.body.link,
      image: imageUrl
    });

    await newCarousel.save();
    const uploadTime = Date.now() - uploadStartTime;

    console.log('✅ [CAROUSEL IMAGE UPLOAD] Carousel item created successfully');
    console.log('📊 [CAROUSEL IMAGE UPLOAD] Upload completed in:', `${uploadTime}ms`);
    console.log('📝 [CAROUSEL IMAGE UPLOAD] Carousel ID:', newCarousel._id);
    console.log('='.repeat(80) + '\n');

    res.status(201).json({
      message: 'Carousel item created successfully',
      carousel: newCarousel
    });

  } catch (error) {
    const uploadTime = Date.now() - uploadStartTime;
    console.error('❌ [CAROUSEL IMAGE UPLOAD] Error details:', {
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
        console.log('🧹 [CAROUSEL IMAGE UPLOAD] Cleaned up file after error:', req.file.path);
      } catch (unlinkError) {
        console.error('❌ [CAROUSEL IMAGE UPLOAD] Failed to clean up file:', unlinkError);
      }
    }
    
    console.log('='.repeat(80) + '\n');
    res.status(500).json({ message: 'Failed to create carousel item' });
  }
});

/* -------------------------------
   GET /carousel (List + Pagination)
--------------------------------*/
router.get('/', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const totalCount = await Carousel.countDocuments();

    const carouselItems = await Carousel.find()
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      carouselItems,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch carousel items' });
  }
});

/* -------------------------------
   GET /carousel/:id
--------------------------------*/
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const carousel = await Carousel.findById(id);

    if (!carousel) {
      return res.status(404).json({ message: 'Carousel item not found' });
    }

    res.status(200).json(carousel);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch carousel item' });
  }
});

/* -------------------------------
   PUT /carousel/:id (Update)
--------------------------------*/
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  const uploadStartTime = Date.now();
  try {
    const { id } = req.params;

    console.log('\n' + '='.repeat(80));
    console.log('📸 [CAROUSEL IMAGE UPLOAD] PUT /carousel/:id - Updating carousel item');
    console.log('─'.repeat(80));
    console.log('Request received at:', new Date().toISOString());
    console.log('Carousel ID:', id);
    console.log('User:', req.user ? { id: req.user.id || req.user.userId, username: req.user.username } : 'Not authenticated');

    if (!mongoose.isValidObjectId(id)) {
      console.error('❌ [CAROUSEL IMAGE UPLOAD] Error: Invalid ID format');
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const carousel = await Carousel.findById(id);

    if (!carousel) {
      console.error('❌ [CAROUSEL IMAGE UPLOAD] Error: Carousel item not found');
      return res.status(404).json({ message: 'Carousel item not found' });
    }

    console.log('✅ [CAROUSEL IMAGE UPLOAD] Carousel item found');

    const updateData = {
      title: req.body.title,
      description: req.body.description,
      buttonTitle: req.body.buttonTitle,
      link: req.body.link
    };

    if (req.file) {
      console.log('📁 [CAROUSEL IMAGE UPLOAD] New image file received:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: `${(req.file.size / 1024).toFixed(2)} KB`,
        path: req.file.path
      });

      // Delete old file
      if (carousel.image) {
        const oldPath = path.join(
          __dirname,
          '..',
          'uploads',
          'carousel',
          path.basename(carousel.image)
        );

        console.log('🗑️  [CAROUSEL IMAGE UPLOAD] Deleting old image:', oldPath);
        try {
          await fs.unlink(oldPath);
          console.log('✅ [CAROUSEL IMAGE UPLOAD] Old image deleted successfully');
        } catch (unlinkError) {
          console.warn('⚠️  [CAROUSEL IMAGE UPLOAD] Could not delete old image (may not exist):', unlinkError.message);
        }
      }

      // Verify new file exists
      try {
        await fs.access(req.file.path);
        console.log('✅ [CAROUSEL IMAGE UPLOAD] New file verified at path:', req.file.path);
      } catch (accessError) {
        console.error('❌ [CAROUSEL IMAGE UPLOAD] Error: New file does not exist at path:', req.file.path);
        throw new Error(`Uploaded file not found: ${accessError.message}`);
      }

      console.log('🔗 [CAROUSEL IMAGE UPLOAD] Building new image URL...');
      updateData.image = buildImageUrl(req, req.file.filename);
      console.log('✅ [CAROUSEL IMAGE UPLOAD] New image URL built:', updateData.image);
    } else {
      console.log('ℹ️  [CAROUSEL IMAGE UPLOAD] No new image provided, keeping existing image');
    }

    console.log('💾 [CAROUSEL IMAGE UPLOAD] Updating carousel item...');
    const updatedCarousel = await Carousel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    const uploadTime = Date.now() - uploadStartTime;
    console.log('✅ [CAROUSEL IMAGE UPLOAD] Carousel item updated successfully');
    console.log('📊 [CAROUSEL IMAGE UPLOAD] Update completed in:', `${uploadTime}ms`);
    console.log('='.repeat(80) + '\n');

    res.status(200).json({
      message: 'Carousel item updated successfully',
      carousel: updatedCarousel
    });

  } catch (error) {
    const uploadTime = Date.now() - uploadStartTime;
    console.error('❌ [CAROUSEL IMAGE UPLOAD] Error details:', {
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
        console.log('🧹 [CAROUSEL IMAGE UPLOAD] Cleaned up file after error:', req.file.path);
      } catch (unlinkError) {
        console.error('❌ [CAROUSEL IMAGE UPLOAD] Failed to clean up file:', unlinkError);
      }
    }
    
    console.log('='.repeat(80) + '\n');
    res.status(500).json({ message: 'Failed to update carousel item' });
  }
});

/* -------------------------------
   DELETE /carousel/:id
--------------------------------*/
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const carousel = await Carousel.findById(req.params.id);

    if (!carousel) {
      return res.status(404).json({ message: 'Carousel item not found' });
    }

    // Delete file from disk
    if (carousel.image) {
      const oldPath = path.join(
        __dirname,
        '..',
        'uploads',
        'carousel',
        path.basename(carousel.image)
      );

      await fs.unlink(oldPath).catch(() => {});
    }

    await Carousel.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Carousel item deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete carousel item' });
  }
});

module.exports = router;
