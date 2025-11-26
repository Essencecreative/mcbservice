// routes/management.js
const express = require('express');
const mongoose = require('mongoose');
const Management = require('../models/Management');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { buildImageUrl: buildImageUrlUtil } = require('../utils/imageUrl');

const router = express.Router();

/* -------------------------------
   Multer Storage for photos
--------------------------------*/
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadPath = path.join(__dirname, '..', 'uploads', 'management');
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
   Helper: Build public photo URL
--------------------------------*/
const buildPhotoUrl = (req, filename) => {
  return buildImageUrlUtil(req, `uploads/management/${filename}`);
};

/* -------------------------------
   POST /management - Create
--------------------------------*/
router.post('/', authenticateToken, upload.single('photo'), async (req, res) => {
  const uploadStartTime = Date.now();
  try {
    console.log('\n' + '='.repeat(80));
    console.log('📸 [MANAGEMENT PHOTO UPLOAD] POST /management - Creating new management member');
    console.log('─'.repeat(80));
    console.log('Request received at:', new Date().toISOString());
    console.log('User:', req.user ? { id: req.user.id || req.user.userId, username: req.user.username } : 'Not authenticated');

    const { position, title, fullName, linkedinLink } = req.body;

    let photoUrl = '';
    if (req.file) {
      console.log('📁 [MANAGEMENT PHOTO UPLOAD] Photo file received:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: `${(req.file.size / 1024).toFixed(2)} KB`,
        path: req.file.path
      });

      // Verify file exists
      try {
        await fs.access(req.file.path);
        console.log('✅ [MANAGEMENT PHOTO UPLOAD] File verified at path:', req.file.path);
      } catch (accessError) {
        console.error('❌ [MANAGEMENT PHOTO UPLOAD] Error: File does not exist at path:', req.file.path);
        throw new Error(`Uploaded file not found: ${accessError.message}`);
      }

      console.log('🔗 [MANAGEMENT PHOTO UPLOAD] Building photo URL...');
      photoUrl = buildPhotoUrl(req, req.file.filename);
      console.log('✅ [MANAGEMENT PHOTO UPLOAD] Photo URL built:', photoUrl);
    } else {
      console.log('ℹ️  [MANAGEMENT PHOTO UPLOAD] No photo provided');
    }

    console.log('💾 [MANAGEMENT PHOTO UPLOAD] Creating management member with data:', {
      position,
      title,
      fullName,
      linkedinLink: linkedinLink ? 'provided' : 'not provided'
    });

    const newMember = new Management({
      position: position ? parseInt(position) : 0,
      title,
      fullName,
      linkedinLink: linkedinLink || '',
      photo: photoUrl
    });

    await newMember.save();
    const uploadTime = Date.now() - uploadStartTime;

    console.log('✅ [MANAGEMENT PHOTO UPLOAD] Management member created successfully');
    console.log('📊 [MANAGEMENT PHOTO UPLOAD] Upload completed in:', `${uploadTime}ms`);
    console.log('📝 [MANAGEMENT PHOTO UPLOAD] Management Member ID:', newMember._id);
    console.log('='.repeat(80) + '\n');

    res.status(201).json({
      message: 'Management member created successfully',
      member: newMember
    });
  } catch (error) {
    const uploadTime = Date.now() - uploadStartTime;
    console.error('❌ [MANAGEMENT PHOTO UPLOAD] Error details:', {
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
        console.log('🧹 [MANAGEMENT PHOTO UPLOAD] Cleaned up file after error:', req.file.path);
      } catch (unlinkError) {
        console.error('❌ [MANAGEMENT PHOTO UPLOAD] Failed to clean up file:', unlinkError);
      }
    }
    
    console.log('='.repeat(80) + '\n');
    res.status(500).json({ message: 'Failed to create management member' });
  }
});

/* -------------------------------
   GET /management - List (sorted by position) with pagination
--------------------------------*/
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'position', sortOrder = 'asc' } = req.query;
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const members = await Management.find()
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalCount = await Management.countDocuments();

    res.status(200).json({
      members,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch management members' });
  }
});

/* -------------------------------
   GET /management/:id - Single
--------------------------------*/
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid management member ID' });
    }

    const member = await Management.findById(id);

    if (!member) {
      return res.status(404).json({ message: 'Management member not found' });
    }

    res.status(200).json(member);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch management member' });
  }
});

/* -------------------------------
   PUT /management/:id - Update
--------------------------------*/
router.put('/:id', authenticateToken, upload.single('photo'), async (req, res) => {
  const uploadStartTime = Date.now();
  try {
    const { id } = req.params;
    const { position, title, fullName, linkedinLink } = req.body;

    console.log('\n' + '='.repeat(80));
    console.log('📸 [MANAGEMENT PHOTO UPLOAD] PUT /management/:id - Updating management member');
    console.log('─'.repeat(80));
    console.log('Request received at:', new Date().toISOString());
    console.log('Management Member ID:', id);
    console.log('User:', req.user ? { id: req.user.id || req.user.userId, username: req.user.username } : 'Not authenticated');

    if (!mongoose.isValidObjectId(id)) {
      console.error('❌ [MANAGEMENT PHOTO UPLOAD] Error: Invalid management member ID format');
      return res.status(400).json({ message: 'Invalid management member ID' });
    }

    const member = await Management.findById(id);
    if (!member) {
      console.error('❌ [MANAGEMENT PHOTO UPLOAD] Error: Management member not found');
      return res.status(404).json({ message: 'Management member not found' });
    }

    console.log('✅ [MANAGEMENT PHOTO UPLOAD] Management member found');

    const updateData = {
      position: position ? parseInt(position) : member.position,
      title,
      fullName,
      linkedinLink: linkedinLink || ''
    };

    if (req.file) {
      console.log('📁 [MANAGEMENT PHOTO UPLOAD] New photo file received:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: `${(req.file.size / 1024).toFixed(2)} KB`,
        path: req.file.path
      });

      // Delete old photo if exists
      if (member.photo && !member.photo.startsWith('http')) {
        const oldPath = path.join(__dirname, '..', 'uploads', 'management', path.basename(member.photo));
        console.log('🗑️  [MANAGEMENT PHOTO UPLOAD] Deleting old photo:', oldPath);
        try {
          await fs.unlink(oldPath);
          console.log('✅ [MANAGEMENT PHOTO UPLOAD] Old photo deleted successfully');
        } catch (unlinkError) {
          console.warn('⚠️  [MANAGEMENT PHOTO UPLOAD] Could not delete old photo (may not exist):', unlinkError.message);
        }
      }

      // Verify new file exists
      try {
        await fs.access(req.file.path);
        console.log('✅ [MANAGEMENT PHOTO UPLOAD] New file verified at path:', req.file.path);
      } catch (accessError) {
        console.error('❌ [MANAGEMENT PHOTO UPLOAD] Error: New file does not exist at path:', req.file.path);
        throw new Error(`Uploaded file not found: ${accessError.message}`);
      }

      console.log('🔗 [MANAGEMENT PHOTO UPLOAD] Building new photo URL...');
      updateData.photo = buildPhotoUrl(req, req.file.filename);
      console.log('✅ [MANAGEMENT PHOTO UPLOAD] New photo URL built:', updateData.photo);
    } else {
      console.log('ℹ️  [MANAGEMENT PHOTO UPLOAD] No new photo provided, keeping existing photo');
    }

    console.log('💾 [MANAGEMENT PHOTO UPLOAD] Updating management member...');
    const updatedMember = await Management.findByIdAndUpdate(id, updateData, { new: true });

    const uploadTime = Date.now() - uploadStartTime;
    console.log('✅ [MANAGEMENT PHOTO UPLOAD] Management member updated successfully');
    console.log('📊 [MANAGEMENT PHOTO UPLOAD] Update completed in:', `${uploadTime}ms`);
    console.log('='.repeat(80) + '\n');

    res.status(200).json({
      message: 'Management member updated successfully',
      member: updatedMember
    });
  } catch (error) {
    const uploadTime = Date.now() - uploadStartTime;
    console.error('❌ [MANAGEMENT PHOTO UPLOAD] Error details:', {
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
        console.log('🧹 [MANAGEMENT PHOTO UPLOAD] Cleaned up file after error:', req.file.path);
      } catch (unlinkError) {
        console.error('❌ [MANAGEMENT PHOTO UPLOAD] Failed to clean up file:', unlinkError);
      }
    }
    
    console.log('='.repeat(80) + '\n');
    res.status(500).json({ message: 'Failed to update management member' });
  }
});

/* -------------------------------
   DELETE /management/:id
--------------------------------*/
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const member = await Management.findById(id);
    if (!member) return res.status(404).json({ message: 'Management member not found' });

    // Delete old photo if exists
    if (member.photo && !member.photo.startsWith('http')) {
      const oldPath = path.join(__dirname, '..', 'uploads', 'management', path.basename(member.photo));
      await fs.unlink(oldPath).catch(() => {});
    }

    await Management.findByIdAndDelete(id);

    res.status(200).json({ message: 'Management member deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete management member' });
  }
});

module.exports = router;
