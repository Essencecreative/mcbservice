// routes/management.js
const express = require('express');
const mongoose = require('mongoose');
const Management = require('../models/Management');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

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
  return `${req.protocol}://${req.get('host')}/uploads/management/${filename}`;
};

/* -------------------------------
   POST /management - Create
--------------------------------*/
router.post('/', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { position, title, fullName, linkedinLink } = req.body;

    const photoUrl = req.file ? buildPhotoUrl(req, req.file.filename) : '';

    const newMember = new Management({
      position: position ? parseInt(position) : 0,
      title,
      fullName,
      linkedinLink: linkedinLink || '',
      photo: photoUrl
    });

    await newMember.save();

    res.status(201).json({
      message: 'Management member created successfully',
      member: newMember
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create management member' });
  }
});

/* -------------------------------
   GET /management - List (sorted by position)
--------------------------------*/
router.get('/', async (req, res) => {
  try {
    const members = await Management.find().sort({ position: 1 });

    res.status(200).json({
      members,
      totalCount: members.length
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
  try {
    const { id } = req.params;
    const { position, title, fullName, linkedinLink } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid management member ID' });
    }

    const member = await Management.findById(id);
    if (!member) return res.status(404).json({ message: 'Management member not found' });

    const updateData = {
      position: position ? parseInt(position) : member.position,
      title,
      fullName,
      linkedinLink: linkedinLink || ''
    };

    if (req.file) {
      // Delete old photo if exists
      if (member.photo && !member.photo.startsWith('http')) {
        const oldPath = path.join(__dirname, '..', 'uploads', 'management', path.basename(member.photo));
        await fs.unlink(oldPath).catch(() => {});
      }
      updateData.photo = buildPhotoUrl(req, req.file.filename);
    }

    const updatedMember = await Management.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({
      message: 'Management member updated successfully',
      member: updatedMember
    });
  } catch (error) {
    console.error(error);
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
