const express = require('express');
const mongoose = require('mongoose');
const BoardOfDirector = require('../models/BoardOfDirector');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Multer disk storage for local uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'board-of-directors');
    fs.mkdir(uploadPath, { recursive: true })
      .then(() => cb(null, uploadPath))
      .catch(err => cb(err));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// POST /board-of-directors - Create board member
router.post('/', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { position, title, fullName, linkedinLink } = req.body;

    const newMember = new BoardOfDirector({
      position: position ? parseInt(position) : 0,
      title,
      fullName,
      linkedinLink: linkedinLink || '',
      photo: req.file ? req.file.path : '',
    });

    await newMember.save();

    res.status(201).json({ 
      message: 'Board member created successfully', 
      member: newMember 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create board member' });
  }
});

// GET /board-of-directors - Fetch all board members (sorted by position)
router.get('/', async (req, res) => {
  try {
    const members = await BoardOfDirector.find()
      .sort({ position: 1 });

    res.status(200).json({
      members,
      totalCount: members.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch board members' });
  }
});

// GET /board-of-directors/:id - Fetch single board member
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
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

// PUT /board-of-directors/:id - Update board member
router.put('/:id', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { position, title, fullName, linkedinLink } = req.body;

    const member = await BoardOfDirector.findById(id);
    if (!member) {
      return res.status(404).json({ message: 'Board member not found' });
    }

    const updateData = {
      position: position ? parseInt(position) : member.position,
      title,
      fullName,
      linkedinLink: linkedinLink || '',
    };

    if (req.file) {
      // Delete old image if it exists
      if (member.photo) {
        await fs.unlink(member.photo).catch(console.error);
      }
      updateData.photo = req.file.path;
    }

    const updatedMember = await BoardOfDirector.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({ 
      message: 'Board member updated successfully', 
      member: updatedMember 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update board member' });
  }
});

// DELETE /board-of-directors/:id - Delete board member
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const member = await BoardOfDirector.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Board member not found' });
    }

    // Delete image file if it exists
    if (member.photo) {
      await fs.unlink(member.photo).catch(console.error);
    }

    await BoardOfDirector.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Board member deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete board member' });
  }
});

module.exports = router;

