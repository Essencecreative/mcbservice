const express = require('express');
const mongoose = require('mongoose');
const NewsAndUpdate = require('../models/NewsAndUpdate');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { buildImageUrl: buildImageUrlUtil, extractFilePath } = require('../utils/imageUrl');

const router = express.Router();

/* -------------------------------
   Multer Storage for image uploads
--------------------------------*/
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadPath = path.join(__dirname, '..', 'uploads', 'news-and-updates');
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
   Helper: Build public image URL
--------------------------------*/
const buildImageUrl = (req, filename) => {
  return buildImageUrlUtil(req, `uploads/news-and-updates/${filename}`);
};

/* -------------------------------
   POST /news-and-updates - Create
--------------------------------*/
router.post('/', authenticateToken, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'bannerPhoto', maxCount: 1 }]), async (req, res) => {
  const uploadStartTime = Date.now();
  try {
    console.log('\n' + '='.repeat(80));
    console.log('📸 [NEWS & UPDATES IMAGE UPLOAD] POST /news-and-updates - Creating new news item');
    console.log('─'.repeat(80));
    console.log('Request received at:', new Date().toISOString());
    console.log('User:', req.user ? { id: req.user.id || req.user.userId, username: req.user.username } : 'Not authenticated');

    const { title, shortDescription, content, publishedDate } = req.body;

    if (!req.files || !req.files['image'] || req.files['image'].length === 0) {
      console.error('❌ [NEWS & UPDATES IMAGE UPLOAD] Error: No image file provided');
      return res.status(400).json({ message: 'Image is required' });
    }

    // Log main image
    const mainImage = req.files['image'][0];
    console.log('📁 [NEWS & UPDATES IMAGE UPLOAD] Main image file received:', {
      originalname: mainImage.originalname,
      filename: mainImage.filename,
      mimetype: mainImage.mimetype,
      size: `${(mainImage.size / 1024).toFixed(2)} KB`,
      path: mainImage.path
    });

    // Verify main image exists
    try {
      await fs.access(mainImage.path);
      console.log('✅ [NEWS & UPDATES IMAGE UPLOAD] Main image verified at path:', mainImage.path);
    } catch (accessError) {
      console.error('❌ [NEWS & UPDATES IMAGE UPLOAD] Error: Main image does not exist at path:', mainImage.path);
      throw new Error(`Uploaded main image not found: ${accessError.message}`);
    }

    // Log banner photo if provided
    let bannerPhotoUrl = null;
    if (req.files['bannerPhoto'] && req.files['bannerPhoto'].length > 0) {
      const bannerPhoto = req.files['bannerPhoto'][0];
      console.log('📁 [NEWS & UPDATES IMAGE UPLOAD] Banner photo file received:', {
        originalname: bannerPhoto.originalname,
        filename: bannerPhoto.filename,
        mimetype: bannerPhoto.mimetype,
        size: `${(bannerPhoto.size / 1024).toFixed(2)} KB`,
        path: bannerPhoto.path
      });

      // Verify banner photo exists
      try {
        await fs.access(bannerPhoto.path);
        console.log('✅ [NEWS & UPDATES IMAGE UPLOAD] Banner photo verified at path:', bannerPhoto.path);
      } catch (accessError) {
        console.error('❌ [NEWS & UPDATES IMAGE UPLOAD] Error: Banner photo does not exist at path:', bannerPhoto.path);
        throw new Error(`Uploaded banner photo not found: ${accessError.message}`);
      }

      console.log('🔗 [NEWS & UPDATES IMAGE UPLOAD] Building banner photo URL...');
      bannerPhotoUrl = buildImageUrl(req, bannerPhoto.filename);
      console.log('✅ [NEWS & UPDATES IMAGE UPLOAD] Banner photo URL built:', bannerPhotoUrl);
    } else {
      console.log('ℹ️  [NEWS & UPDATES IMAGE UPLOAD] No banner photo provided');
    }

    console.log('🔗 [NEWS & UPDATES IMAGE UPLOAD] Building main image URL...');
    const imageUrl = buildImageUrl(req, mainImage.filename);
    console.log('✅ [NEWS & UPDATES IMAGE UPLOAD] Main image URL built:', imageUrl);

    console.log('💾 [NEWS & UPDATES IMAGE UPLOAD] Creating news item with data:', {
      title,
      shortDescription: shortDescription?.substring(0, 50) + '...',
      publishedDate: publishedDate || 'current date'
    });

    const newNews = new NewsAndUpdate({
      title,
      shortDescription,
      content,
      image: imageUrl,
      bannerPhoto: bannerPhotoUrl,
      publishedDate: publishedDate ? new Date(publishedDate) : new Date()
    });

    await newNews.save();
    const uploadTime = Date.now() - uploadStartTime;

    console.log('✅ [NEWS & UPDATES IMAGE UPLOAD] News item created successfully');
    console.log('📊 [NEWS & UPDATES IMAGE UPLOAD] Upload completed in:', `${uploadTime}ms`);
    console.log('📝 [NEWS & UPDATES IMAGE UPLOAD] News ID:', newNews._id);
    console.log('='.repeat(80) + '\n');

    res.status(201).json({ message: 'News & Update created successfully', newsAndUpdate: newNews });
  } catch (error) {
    const uploadTime = Date.now() - uploadStartTime;
    console.error('❌ [NEWS & UPDATES IMAGE UPLOAD] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      uploadTime: `${uploadTime}ms`,
      filesInfo: req.files ? {
        image: req.files['image'] ? req.files['image'].map(f => ({
          originalname: f.originalname,
          filename: f.filename,
          path: f.path
        })) : null,
        bannerPhoto: req.files['bannerPhoto'] ? req.files['bannerPhoto'].map(f => ({
          originalname: f.originalname,
          filename: f.filename,
          path: f.path
        })) : null
      } : null
    });
    
    // Clean up uploaded files if they exist but there was an error
    if (req.files) {
      const allFiles = [
        ...(req.files['image'] || []),
        ...(req.files['bannerPhoto'] || [])
      ];
      for (const file of allFiles) {
        if (file.path) {
          try {
            await fs.unlink(file.path);
            console.log('🧹 [NEWS & UPDATES IMAGE UPLOAD] Cleaned up file after error:', file.path);
          } catch (unlinkError) {
            console.error('❌ [NEWS & UPDATES IMAGE UPLOAD] Failed to clean up file:', unlinkError);
          }
        }
      }
    }
    
    console.log('='.repeat(80) + '\n');
    res.status(500).json({ message: 'Failed to create news & update' });
  }
});

/* -------------------------------
   GET /news-and-updates - List with pagination
--------------------------------*/
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'publishedDate', sortOrder = 'desc' } = req.query;

    // Sort by publishedDate (newest first), fallback to createdAt if publishedDate doesn't exist
    const sortOptions = { 
      publishedDate: -1,
      createdAt: -1 
    };
    const newsList = await NewsAndUpdate.find()
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalCount = await NewsAndUpdate.countDocuments();

    res.status(200).json({
      newsAndUpdates: newsList,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch news & updates' });
  }
});

/* -------------------------------
   GET /news-and-updates/:id - Single
--------------------------------*/
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid ID' });

    const news = await NewsAndUpdate.findById(id);
    if (!news) return res.status(404).json({ message: 'News & Update not found' });

    res.status(200).json(news);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch news & update' });
  }
});

/* -------------------------------
   PUT /news-and-updates/:id - Update
--------------------------------*/
router.put('/:id', authenticateToken, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'bannerPhoto', maxCount: 1 }]), async (req, res) => {
  const uploadStartTime = Date.now();
  try {
    const { id } = req.params;

    console.log('\n' + '='.repeat(80));
    console.log('📸 [NEWS & UPDATES IMAGE UPLOAD] PUT /news-and-updates/:id - Updating news item');
    console.log('─'.repeat(80));
    console.log('Request received at:', new Date().toISOString());
    console.log('News ID:', id);
    console.log('User:', req.user ? { id: req.user.id || req.user.userId, username: req.user.username } : 'Not authenticated');

    if (!mongoose.isValidObjectId(id)) {
      console.error('❌ [NEWS & UPDATES IMAGE UPLOAD] Error: Invalid ID format');
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const news = await NewsAndUpdate.findById(id);
    if (!news) {
      console.error('❌ [NEWS & UPDATES IMAGE UPLOAD] Error: News item not found');
      return res.status(404).json({ message: 'News & Update not found' });
    }

    console.log('✅ [NEWS & UPDATES IMAGE UPLOAD] News item found');

    const { title, shortDescription, content, publishedDate } = req.body;
    const updateData = { title, shortDescription, content };
    
    if (publishedDate) {
      updateData.publishedDate = new Date(publishedDate);
    }

    if (req.files && req.files['image'] && req.files['image'].length > 0) {
      const newImage = req.files['image'][0];
      console.log('📁 [NEWS & UPDATES IMAGE UPLOAD] New main image file received:', {
        originalname: newImage.originalname,
        filename: newImage.filename,
        mimetype: newImage.mimetype,
        size: `${(newImage.size / 1024).toFixed(2)} KB`,
        path: newImage.path
      });

      // Delete old image if exists
      if (news.image) {
        const relativePath = extractFilePath(news.image, req);
        const oldPath = path.join(__dirname, '..', relativePath);
        console.log('🗑️  [NEWS & UPDATES IMAGE UPLOAD] Deleting old main image:', oldPath);
        try {
          await fs.unlink(oldPath);
          console.log('✅ [NEWS & UPDATES IMAGE UPLOAD] Old main image deleted successfully');
        } catch (unlinkError) {
          console.warn('⚠️  [NEWS & UPDATES IMAGE UPLOAD] Could not delete old main image (may not exist):', unlinkError.message);
        }
      }

      // Verify new image exists
      try {
        await fs.access(newImage.path);
        console.log('✅ [NEWS & UPDATES IMAGE UPLOAD] New main image verified at path:', newImage.path);
      } catch (accessError) {
        console.error('❌ [NEWS & UPDATES IMAGE UPLOAD] Error: New main image does not exist at path:', newImage.path);
        throw new Error(`Uploaded main image not found: ${accessError.message}`);
      }

      console.log('🔗 [NEWS & UPDATES IMAGE UPLOAD] Building new main image URL...');
      updateData.image = buildImageUrl(req, newImage.filename);
      console.log('✅ [NEWS & UPDATES IMAGE UPLOAD] New main image URL built:', updateData.image);
    } else {
      console.log('ℹ️  [NEWS & UPDATES IMAGE UPLOAD] No new main image provided, keeping existing image');
    }

    if (req.files && req.files['bannerPhoto'] && req.files['bannerPhoto'].length > 0) {
      const newBannerPhoto = req.files['bannerPhoto'][0];
      console.log('📁 [NEWS & UPDATES IMAGE UPLOAD] New banner photo file received:', {
        originalname: newBannerPhoto.originalname,
        filename: newBannerPhoto.filename,
        mimetype: newBannerPhoto.mimetype,
        size: `${(newBannerPhoto.size / 1024).toFixed(2)} KB`,
        path: newBannerPhoto.path
      });

      // Delete old banner photo if exists
      if (news.bannerPhoto) {
        const relativePath = extractFilePath(news.bannerPhoto, req);
        const oldPath = path.join(__dirname, '..', relativePath);
        console.log('🗑️  [NEWS & UPDATES IMAGE UPLOAD] Deleting old banner photo:', oldPath);
        try {
          await fs.unlink(oldPath);
          console.log('✅ [NEWS & UPDATES IMAGE UPLOAD] Old banner photo deleted successfully');
        } catch (unlinkError) {
          console.warn('⚠️  [NEWS & UPDATES IMAGE UPLOAD] Could not delete old banner photo (may not exist):', unlinkError.message);
        }
      }

      // Verify new banner photo exists
      try {
        await fs.access(newBannerPhoto.path);
        console.log('✅ [NEWS & UPDATES IMAGE UPLOAD] New banner photo verified at path:', newBannerPhoto.path);
      } catch (accessError) {
        console.error('❌ [NEWS & UPDATES IMAGE UPLOAD] Error: New banner photo does not exist at path:', newBannerPhoto.path);
        throw new Error(`Uploaded banner photo not found: ${accessError.message}`);
      }

      console.log('🔗 [NEWS & UPDATES IMAGE UPLOAD] Building new banner photo URL...');
      updateData.bannerPhoto = buildImageUrl(req, newBannerPhoto.filename);
      console.log('✅ [NEWS & UPDATES IMAGE UPLOAD] New banner photo URL built:', updateData.bannerPhoto);
    } else {
      console.log('ℹ️  [NEWS & UPDATES IMAGE UPLOAD] No new banner photo provided, keeping existing banner photo');
    }

    console.log('💾 [NEWS & UPDATES IMAGE UPLOAD] Updating news item...');
    const updatedNews = await NewsAndUpdate.findByIdAndUpdate(id, updateData, { new: true });

    const uploadTime = Date.now() - uploadStartTime;
    console.log('✅ [NEWS & UPDATES IMAGE UPLOAD] News item updated successfully');
    console.log('📊 [NEWS & UPDATES IMAGE UPLOAD] Update completed in:', `${uploadTime}ms`);
    console.log('='.repeat(80) + '\n');

    res.status(200).json({ message: 'News & Update updated successfully', newsAndUpdate: updatedNews });
  } catch (error) {
    const uploadTime = Date.now() - uploadStartTime;
    console.error('❌ [NEWS & UPDATES IMAGE UPLOAD] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      uploadTime: `${uploadTime}ms`,
      filesInfo: req.files ? {
        image: req.files['image'] ? req.files['image'].map(f => ({
          originalname: f.originalname,
          filename: f.filename,
          path: f.path
        })) : null,
        bannerPhoto: req.files['bannerPhoto'] ? req.files['bannerPhoto'].map(f => ({
          originalname: f.originalname,
          filename: f.filename,
          path: f.path
        })) : null
      } : null
    });
    
    // Clean up uploaded files if they exist but there was an error
    if (req.files) {
      const allFiles = [
        ...(req.files['image'] || []),
        ...(req.files['bannerPhoto'] || [])
      ];
      for (const file of allFiles) {
        if (file.path) {
          try {
            await fs.unlink(file.path);
            console.log('🧹 [NEWS & UPDATES IMAGE UPLOAD] Cleaned up file after error:', file.path);
          } catch (unlinkError) {
            console.error('❌ [NEWS & UPDATES IMAGE UPLOAD] Failed to clean up file:', unlinkError);
          }
        }
      }
    }
    
    console.log('='.repeat(80) + '\n');
    res.status(500).json({ message: 'Failed to update news & update' });
  }
});

/* -------------------------------
   DELETE /news-and-updates/:id
--------------------------------*/
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid ID' });

    const news = await NewsAndUpdate.findById(id);
    if (!news) return res.status(404).json({ message: 'News & Update not found' });

    // Delete image if exists
    if (news.image) {
      const relativePath = extractFilePath(news.image, req);
      const oldPath = path.join(__dirname, '..', relativePath);
      await fs.unlink(oldPath).catch(() => {});
    }

    // Delete banner photo if exists
    if (news.bannerPhoto) {
      const relativePath = extractFilePath(news.bannerPhoto, req);
      const oldPath = path.join(__dirname, '..', relativePath);
      await fs.unlink(oldPath).catch(() => {});
    }

    await NewsAndUpdate.findByIdAndDelete(id);
    res.status(200).json({ message: 'News & Update deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete news & update' });
  }
});

module.exports = router;
