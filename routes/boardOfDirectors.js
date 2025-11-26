// routes/board-of-directors.js
const express = require('express');
const mongoose = require('mongoose');
const BoardOfDirector = require('../models/BoardOfDirector');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { buildImageUrl: buildImageUrlUtil } = require('../utils/imageUrl');

const router = express.Router();

/* -------------------------------------
   Multer Storage for Board Member Photos
---------------------------------------*/
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadPath = path.join(__dirname, '..', 'uploads', 'board-of-directors');
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

/* -------------------------------------
   Helper: Build Public Image URL
---------------------------------------*/
const buildImageUrl = (req, filename) => {
  return buildImageUrlUtil(req, `uploads/board-of-directors/${filename}`);
};

/* -------------------------------------
   POST /board-of-directors - Create
---------------------------------------*/
router.post('/', authenticateToken, upload.single('photo'), async (req, res) => {
  const uploadStartTime = Date.now();
  try {
    console.log('\n' + '='.repeat(80));
    console.log('📸 [BOARD OF DIRECTORS PHOTO UPLOAD] POST /board-of-directors - Creating new board member');
    console.log('─'.repeat(80));
    console.log('Request received at:', new Date().toISOString());
    console.log('User:', req.user ? { id: req.user.id || req.user.userId, username: req.user.username } : 'Not authenticated');

    const { position, title, fullName, linkedinLink } = req.body;

    let photoUrl = '';
    if (req.file) {
      console.log('📁 [BOARD OF DIRECTORS PHOTO UPLOAD] Photo file received:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: `${(req.file.size / 1024).toFixed(2)} KB`,
        path: req.file.path
      });

      // Verify file exists
      try {
        await fs.access(req.file.path);
        console.log('✅ [BOARD OF DIRECTORS PHOTO UPLOAD] File verified at path:', req.file.path);
      } catch (accessError) {
        console.error('❌ [BOARD OF DIRECTORS PHOTO UPLOAD] Error: File does not exist at path:', req.file.path);
        throw new Error(`Uploaded file not found: ${accessError.message}`);
      }

      console.log('🔗 [BOARD OF DIRECTORS PHOTO UPLOAD] Building photo URL...');
      photoUrl = buildImageUrl(req, req.file.filename);
      console.log('✅ [BOARD OF DIRECTORS PHOTO UPLOAD] Photo URL built:', photoUrl);
    } else {
      console.log('ℹ️  [BOARD OF DIRECTORS PHOTO UPLOAD] No photo provided');
    }

    console.log('💾 [BOARD OF DIRECTORS PHOTO UPLOAD] Creating board member with data:', {
      position,
      title,
      fullName,
      linkedinLink: linkedinLink ? 'provided' : 'not provided'
    });

    const newMember = new BoardOfDirector({
      position: position ? parseInt(position) : 0,
      title,
      fullName,
      linkedinLink: linkedinLink || '',
      photo: photoUrl
    });

    await newMember.save();
    const uploadTime = Date.now() - uploadStartTime;

    console.log('✅ [BOARD OF DIRECTORS PHOTO UPLOAD] Board member created successfully');
    console.log('📊 [BOARD OF DIRECTORS PHOTO UPLOAD] Upload completed in:', `${uploadTime}ms`);
    console.log('📝 [BOARD OF DIRECTORS PHOTO UPLOAD] Board Member ID:', newMember._id);
    console.log('='.repeat(80) + '\n');

    res.status(201).json({
      message: 'Board member created successfully',
      member: newMember
    });

  } catch (error) {
    const uploadTime = Date.now() - uploadStartTime;
    console.error('❌ [BOARD OF DIRECTORS PHOTO UPLOAD] Error details:', {
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
        console.log('🧹 [BOARD OF DIRECTORS PHOTO UPLOAD] Cleaned up file after error:', req.file.path);
      } catch (unlinkError) {
        console.error('❌ [BOARD OF DIRECTORS PHOTO UPLOAD] Failed to clean up file:', unlinkError);
      }
    }
    
    console.log('='.repeat(80) + '\n');
    res.status(500).json({ message: 'Failed to create board member' });
  }
});

/* -------------------------------------
   GET /board-of-directors - List (sorted by position) with pagination
---------------------------------------*/
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'position', sortOrder = 'asc' } = req.query;
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const members = await BoardOfDirector.find()
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalCount = await BoardOfDirector.countDocuments();

    res.status(200).json({
      members,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch board members' });
  }
});

/* -------------------------------------
   GET /board-of-directors/:id - Single
---------------------------------------*/
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid board member ID' });
    }

    const member = await BoardOfDirector.findById(id);

    if (!member) {
      return res.status(404).json({ message: 'Board member not found' });
    }

    res.status(200).json(member);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch board member' });
  }
});

/* -------------------------------------
   PUT /board-of-directors/:id - Update
---------------------------------------*/
router.put('/:id', authenticateToken, upload.single('photo'), async (req, res) => {
  const uploadStartTime = Date.now();
  try {
    const { id } = req.params;
    const { position, title, fullName, linkedinLink } = req.body;

    console.log('\n' + '='.repeat(80));
    console.log('📸 [BOARD OF DIRECTORS PHOTO UPLOAD] PUT /board-of-directors/:id - Updating board member');
    console.log('─'.repeat(80));
    console.log('Request received at:', new Date().toISOString());
    console.log('Board Member ID:', id);
    console.log('User:', req.user ? { id: req.user.id || req.user.userId, username: req.user.username } : 'Not authenticated');

    if (!mongoose.isValidObjectId(id)) {
      console.error('❌ [BOARD OF DIRECTORS PHOTO UPLOAD] Error: Invalid board member ID format');
      return res.status(400).json({ message: 'Invalid board member ID' });
    }

    const member = await BoardOfDirector.findById(id);

    if (!member) {
      console.error('❌ [BOARD OF DIRECTORS PHOTO UPLOAD] Error: Board member not found');
      return res.status(404).json({ message: 'Board member not found' });
    }

    console.log('✅ [BOARD OF DIRECTORS PHOTO UPLOAD] Board member found');

    const updateData = {
      position: position ? parseInt(position) : member.position,
      title,
      fullName,
      linkedinLink: linkedinLink || ''
    };

    // If a new image was uploaded
    if (req.file) {
      console.log('📁 [BOARD OF DIRECTORS PHOTO UPLOAD] New photo file received:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: `${(req.file.size / 1024).toFixed(2)} KB`,
        path: req.file.path
      });

      // Remove old file
      if (member.photo) {
        const oldPath = path.join(
          __dirname,
          '..',
          'uploads',
          'board-of-directors',
          path.basename(member.photo)
        );
        console.log('🗑️  [BOARD OF DIRECTORS PHOTO UPLOAD] Deleting old photo:', oldPath);
        try {
          await fs.unlink(oldPath);
          console.log('✅ [BOARD OF DIRECTORS PHOTO UPLOAD] Old photo deleted successfully');
        } catch (unlinkError) {
          console.warn('⚠️  [BOARD OF DIRECTORS PHOTO UPLOAD] Could not delete old photo (may not exist):', unlinkError.message);
        }
      }

      // Verify new file exists
      try {
        await fs.access(req.file.path);
        console.log('✅ [BOARD OF DIRECTORS PHOTO UPLOAD] New file verified at path:', req.file.path);
      } catch (accessError) {
        console.error('❌ [BOARD OF DIRECTORS PHOTO UPLOAD] Error: New file does not exist at path:', req.file.path);
        throw new Error(`Uploaded file not found: ${accessError.message}`);
      }

      console.log('🔗 [BOARD OF DIRECTORS PHOTO UPLOAD] Building new photo URL...');
      updateData.photo = buildImageUrl(req, req.file.filename);
      console.log('✅ [BOARD OF DIRECTORS PHOTO UPLOAD] New photo URL built:', updateData.photo);
    } else {
      console.log('ℹ️  [BOARD OF DIRECTORS PHOTO UPLOAD] No new photo provided, keeping existing photo');
    }

    console.log('💾 [BOARD OF DIRECTORS PHOTO UPLOAD] Updating board member...');
    const updatedMember = await BoardOfDirector.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    const uploadTime = Date.now() - uploadStartTime;
    console.log('✅ [BOARD OF DIRECTORS PHOTO UPLOAD] Board member updated successfully');
    console.log('📊 [BOARD OF DIRECTORS PHOTO UPLOAD] Update completed in:', `${uploadTime}ms`);
    console.log('='.repeat(80) + '\n');

    res.status(200).json({
      message: 'Board member updated successfully',
      member: updatedMember
    });

  } catch (error) {
    const uploadTime = Date.now() - uploadStartTime;
    console.error('❌ [BOARD OF DIRECTORS PHOTO UPLOAD] Error details:', {
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
        console.log('🧹 [BOARD OF DIRECTORS PHOTO UPLOAD] Cleaned up file after error:', req.file.path);
      } catch (unlinkError) {
        console.error('❌ [BOARD OF DIRECTORS PHOTO UPLOAD] Failed to clean up file:', unlinkError);
      }
    }
    
    console.log('='.repeat(80) + '\n');
    res.status(500).json({ message: 'Failed to update board member' });
  }
});

/* -------------------------------------
   DELETE /board-of-directors/:id
---------------------------------------*/
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const member = await BoardOfDirector.findById(id);
    if (!member) {
      return res.status(404).json({ message: 'Board member not found' });
    }

    // Delete old image if exists
    if (member.photo) {
      const oldPath = path.join(
        __dirname,
        '..',
        'uploads',
        'board-of-directors',
        path.basename(member.photo)
      );
      await fs.unlink(oldPath).catch(() => {});
    }

    await BoardOfDirector.findByIdAndDelete(id);

    res.status(200).json({ message: 'Board member deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete board member' });
  }
});

module.exports = router;
