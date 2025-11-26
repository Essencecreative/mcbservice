// routes/investorNews.js
const express = require('express');
const mongoose = require('mongoose');
const InvestorNews = require('../models/InvestorNews');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { buildImageUrl: buildImageUrlUtil } = require('../utils/imageUrl');

const router = express.Router();

/* -------------------------------
   Multer Storage for images
--------------------------------*/
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadPath = path.join(__dirname, '..', 'uploads', 'investor-news');
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
  return buildImageUrlUtil(req, `uploads/investor-news/${filename}`);
};

/* -------------------------------
   POST /investor-news - Create
--------------------------------*/
router.post('/', authenticateToken, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'bannerPhoto', maxCount: 1 }]), async (req, res) => {
  const uploadStartTime = Date.now();
  try {
    console.log('\n' + '='.repeat(80));
    console.log('📸 [INVESTOR NEWS IMAGE UPLOAD] POST /investor-news - Creating new investor news item');
    console.log('─'.repeat(80));
    console.log('Request received at:', new Date().toISOString());
    console.log('User:', req.user ? { id: req.user.id || req.user.userId, username: req.user.username } : 'Not authenticated');

    const { title, shortDescription, content, publishedDate } = req.body;

    if (!req.files || !req.files['image'] || req.files['image'].length === 0) {
      console.error('❌ [INVESTOR NEWS IMAGE UPLOAD] Error: No image file provided');
      return res.status(400).json({ message: 'Image is required' });
    }

    // Log main image
    const mainImage = req.files['image'][0];
    console.log('📁 [INVESTOR NEWS IMAGE UPLOAD] Main image file received:', {
      originalname: mainImage.originalname,
      filename: mainImage.filename,
      mimetype: mainImage.mimetype,
      size: `${(mainImage.size / 1024).toFixed(2)} KB`,
      path: mainImage.path
    });

    // Verify main image exists
    try {
      await fs.access(mainImage.path);
      console.log('✅ [INVESTOR NEWS IMAGE UPLOAD] Main image verified at path:', mainImage.path);
    } catch (accessError) {
      console.error('❌ [INVESTOR NEWS IMAGE UPLOAD] Error: Main image does not exist at path:', mainImage.path);
      throw new Error(`Uploaded main image not found: ${accessError.message}`);
    }

    console.log('🔗 [INVESTOR NEWS IMAGE UPLOAD] Building main image URL...');
    const imageUrl = buildImageUrl(req, mainImage.filename);
    console.log('✅ [INVESTOR NEWS IMAGE UPLOAD] Main image URL built:', imageUrl);

    let bannerPhotoUrl = null;
    if (req.files['bannerPhoto'] && req.files['bannerPhoto'].length > 0) {
      const bannerPhoto = req.files['bannerPhoto'][0];
      console.log('📁 [INVESTOR NEWS IMAGE UPLOAD] Banner photo file received:', {
        originalname: bannerPhoto.originalname,
        filename: bannerPhoto.filename,
        mimetype: bannerPhoto.mimetype,
        size: `${(bannerPhoto.size / 1024).toFixed(2)} KB`,
        path: bannerPhoto.path
      });

      // Verify banner photo exists
      try {
        await fs.access(bannerPhoto.path);
        console.log('✅ [INVESTOR NEWS IMAGE UPLOAD] Banner photo verified at path:', bannerPhoto.path);
      } catch (accessError) {
        console.error('❌ [INVESTOR NEWS IMAGE UPLOAD] Error: Banner photo does not exist at path:', bannerPhoto.path);
        throw new Error(`Uploaded banner photo not found: ${accessError.message}`);
      }

      console.log('🔗 [INVESTOR NEWS IMAGE UPLOAD] Building banner photo URL...');
      bannerPhotoUrl = buildImageUrl(req, bannerPhoto.filename);
      console.log('✅ [INVESTOR NEWS IMAGE UPLOAD] Banner photo URL built:', bannerPhotoUrl);
    } else {
      console.log('ℹ️  [INVESTOR NEWS IMAGE UPLOAD] No banner photo provided');
    }

    console.log('💾 [INVESTOR NEWS IMAGE UPLOAD] Creating investor news item with data:', {
      title,
      shortDescription: shortDescription?.substring(0, 50) + '...',
      publishedDate: publishedDate || 'current date'
    });

    const newInvestorNews = new InvestorNews({
      title,
      shortDescription,
      content,
      image: imageUrl,
      bannerPhoto: bannerPhotoUrl,
      publishedDate: publishedDate ? new Date(publishedDate) : new Date()
    });

    await newInvestorNews.save();
    const uploadTime = Date.now() - uploadStartTime;

    console.log('✅ [INVESTOR NEWS IMAGE UPLOAD] Investor news item created successfully');
    console.log('📊 [INVESTOR NEWS IMAGE UPLOAD] Upload completed in:', `${uploadTime}ms`);
    console.log('📝 [INVESTOR NEWS IMAGE UPLOAD] Investor News ID:', newInvestorNews._id);
    console.log('='.repeat(80) + '\n');

    res.status(201).json({
      message: 'Investor news created successfully',
      investorNews: newInvestorNews
    });
  } catch (error) {
    const uploadTime = Date.now() - uploadStartTime;
    console.error('❌ [INVESTOR NEWS IMAGE UPLOAD] Error details:', {
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
            console.log('🧹 [INVESTOR NEWS IMAGE UPLOAD] Cleaned up file after error:', file.path);
          } catch (unlinkError) {
            console.error('❌ [INVESTOR NEWS IMAGE UPLOAD] Failed to clean up file:', unlinkError);
          }
        }
      }
    }
    
    console.log('='.repeat(80) + '\n');
    res.status(500).json({ message: 'Failed to create investor news' });
  }
});

/* -------------------------------
   GET /investor-news - List (paginated)
--------------------------------*/
router.get('/', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'publishedDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const totalCount = await InvestorNews.countDocuments();

    // Sort by publishedDate (newest first), fallback to createdAt if publishedDate doesn't exist
    const investorNews = await InvestorNews.find()
      .sort({ 
        publishedDate: -1,
        createdAt: -1 
      })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      investorNews,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch investor news' });
  }
});

/* -------------------------------
   GET /investor-news/:id - Single
--------------------------------*/
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid investor news ID' });
    }

    const investorNews = await InvestorNews.findById(id);
    if (!investorNews) return res.status(404).json({ message: 'Investor news not found' });

    res.status(200).json(investorNews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch investor news' });
  }
});

/* -------------------------------
   PUT /investor-news/:id - Update
--------------------------------*/
router.put('/:id', authenticateToken, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'bannerPhoto', maxCount: 1 }]), async (req, res) => {
  const uploadStartTime = Date.now();
  try {
    const { id } = req.params;
    const { title, shortDescription, content, publishedDate } = req.body;

    console.log('\n' + '='.repeat(80));
    console.log('📸 [INVESTOR NEWS IMAGE UPLOAD] PUT /investor-news/:id - Updating investor news item');
    console.log('─'.repeat(80));
    console.log('Request received at:', new Date().toISOString());
    console.log('Investor News ID:', id);
    console.log('User:', req.user ? { id: req.user.id || req.user.userId, username: req.user.username } : 'Not authenticated');

    if (!mongoose.isValidObjectId(id)) {
      console.error('❌ [INVESTOR NEWS IMAGE UPLOAD] Error: Invalid investor news ID format');
      return res.status(400).json({ message: 'Invalid investor news ID' });
    }

    const investorNews = await InvestorNews.findById(id);
    if (!investorNews) {
      console.error('❌ [INVESTOR NEWS IMAGE UPLOAD] Error: Investor news not found');
      return res.status(404).json({ message: 'Investor news not found' });
    }

    console.log('✅ [INVESTOR NEWS IMAGE UPLOAD] Investor news item found');

    const updateData = { title, shortDescription, content };
    
    if (publishedDate) {
      updateData.publishedDate = new Date(publishedDate);
    }

    if (req.files && req.files['image'] && req.files['image'].length > 0) {
      const newImage = req.files['image'][0];
      console.log('📁 [INVESTOR NEWS IMAGE UPLOAD] New main image file received:', {
        originalname: newImage.originalname,
        filename: newImage.filename,
        mimetype: newImage.mimetype,
        size: `${(newImage.size / 1024).toFixed(2)} KB`,
        path: newImage.path
      });

      // Delete old image if it exists
      if (investorNews.image && !investorNews.image.startsWith('http')) {
        const oldPath = path.join(__dirname, '..', 'uploads', 'investor-news', path.basename(investorNews.image));
        console.log('🗑️  [INVESTOR NEWS IMAGE UPLOAD] Deleting old main image:', oldPath);
        try {
          await fs.unlink(oldPath);
          console.log('✅ [INVESTOR NEWS IMAGE UPLOAD] Old main image deleted successfully');
        } catch (unlinkError) {
          console.warn('⚠️  [INVESTOR NEWS IMAGE UPLOAD] Could not delete old main image (may not exist):', unlinkError.message);
        }
      }

      // Verify new image exists
      try {
        await fs.access(newImage.path);
        console.log('✅ [INVESTOR NEWS IMAGE UPLOAD] New main image verified at path:', newImage.path);
      } catch (accessError) {
        console.error('❌ [INVESTOR NEWS IMAGE UPLOAD] Error: New main image does not exist at path:', newImage.path);
        throw new Error(`Uploaded main image not found: ${accessError.message}`);
      }

      console.log('🔗 [INVESTOR NEWS IMAGE UPLOAD] Building new main image URL...');
      updateData.image = buildImageUrl(req, newImage.filename);
      console.log('✅ [INVESTOR NEWS IMAGE UPLOAD] New main image URL built:', updateData.image);
    } else {
      console.log('ℹ️  [INVESTOR NEWS IMAGE UPLOAD] No new main image provided, keeping existing image');
    }

    if (req.files && req.files['bannerPhoto'] && req.files['bannerPhoto'].length > 0) {
      const newBannerPhoto = req.files['bannerPhoto'][0];
      console.log('📁 [INVESTOR NEWS IMAGE UPLOAD] New banner photo file received:', {
        originalname: newBannerPhoto.originalname,
        filename: newBannerPhoto.filename,
        mimetype: newBannerPhoto.mimetype,
        size: `${(newBannerPhoto.size / 1024).toFixed(2)} KB`,
        path: newBannerPhoto.path
      });

      // Delete old banner photo if it exists
      if (investorNews.bannerPhoto && !investorNews.bannerPhoto.startsWith('http')) {
        const oldPath = path.join(__dirname, '..', 'uploads', 'investor-news', path.basename(investorNews.bannerPhoto));
        console.log('🗑️  [INVESTOR NEWS IMAGE UPLOAD] Deleting old banner photo:', oldPath);
        try {
          await fs.unlink(oldPath);
          console.log('✅ [INVESTOR NEWS IMAGE UPLOAD] Old banner photo deleted successfully');
        } catch (unlinkError) {
          console.warn('⚠️  [INVESTOR NEWS IMAGE UPLOAD] Could not delete old banner photo (may not exist):', unlinkError.message);
        }
      }

      // Verify new banner photo exists
      try {
        await fs.access(newBannerPhoto.path);
        console.log('✅ [INVESTOR NEWS IMAGE UPLOAD] New banner photo verified at path:', newBannerPhoto.path);
      } catch (accessError) {
        console.error('❌ [INVESTOR NEWS IMAGE UPLOAD] Error: New banner photo does not exist at path:', newBannerPhoto.path);
        throw new Error(`Uploaded banner photo not found: ${accessError.message}`);
      }

      console.log('🔗 [INVESTOR NEWS IMAGE UPLOAD] Building new banner photo URL...');
      updateData.bannerPhoto = buildImageUrl(req, newBannerPhoto.filename);
      console.log('✅ [INVESTOR NEWS IMAGE UPLOAD] New banner photo URL built:', updateData.bannerPhoto);
    } else {
      console.log('ℹ️  [INVESTOR NEWS IMAGE UPLOAD] No new banner photo provided, keeping existing banner photo');
    }

    console.log('💾 [INVESTOR NEWS IMAGE UPLOAD] Updating investor news item...');
    const updatedInvestorNews = await InvestorNews.findByIdAndUpdate(id, updateData, { new: true });

    const uploadTime = Date.now() - uploadStartTime;
    console.log('✅ [INVESTOR NEWS IMAGE UPLOAD] Investor news item updated successfully');
    console.log('📊 [INVESTOR NEWS IMAGE UPLOAD] Update completed in:', `${uploadTime}ms`);
    console.log('='.repeat(80) + '\n');

    res.status(200).json({
      message: 'Investor news updated successfully',
      investorNews: updatedInvestorNews
    });
  } catch (error) {
    const uploadTime = Date.now() - uploadStartTime;
    console.error('❌ [INVESTOR NEWS IMAGE UPLOAD] Error details:', {
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
            console.log('🧹 [INVESTOR NEWS IMAGE UPLOAD] Cleaned up file after error:', file.path);
          } catch (unlinkError) {
            console.error('❌ [INVESTOR NEWS IMAGE UPLOAD] Failed to clean up file:', unlinkError);
          }
        }
      }
    }
    
    console.log('='.repeat(80) + '\n');
    res.status(500).json({ message: 'Failed to update investor news' });
  }
});

/* -------------------------------
   DELETE /investor-news/:id
--------------------------------*/
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const investorNews = await InvestorNews.findById(id);
    if (!investorNews) return res.status(404).json({ message: 'Investor news not found' });

    // Delete old image if exists
    if (investorNews.image && !investorNews.image.startsWith('http')) {
      const oldPath = path.join(__dirname, '..', 'uploads', 'investor-news', path.basename(investorNews.image));
      await fs.unlink(oldPath).catch(() => {});
    }

    // Delete old banner photo if exists
    if (investorNews.bannerPhoto && !investorNews.bannerPhoto.startsWith('http')) {
      const oldPath = path.join(__dirname, '..', 'uploads', 'investor-news', path.basename(investorNews.bannerPhoto));
      await fs.unlink(oldPath).catch(() => {});
    }

    await InvestorNews.findByIdAndDelete(id);

    res.status(200).json({ message: 'Investor news deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete investor news' });
  }
});

module.exports = router;
