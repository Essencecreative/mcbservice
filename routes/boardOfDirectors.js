// routes/board-of-directors.js
const express = require('express');
const mongoose = require('mongoose');
const BoardOfDirector = require('../models/BoardOfDirector');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

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
  return `${req.protocol}://${req.get('host')}/uploads/board-of-directors/${filename}`;
};

/* -------------------------------------
   POST /board-of-directors - Create
---------------------------------------*/
router.post('/', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { position, title, fullName, linkedinLink } = req.body;

    const photoUrl = req.file
      ? buildImageUrl(req, req.file.filename)
      : '';

    const newMember = new BoardOfDirector({
      position: position ? parseInt(position) : 0,
      title,
      fullName,
      linkedinLink: linkedinLink || '',
      photo: photoUrl
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
  try {
    const { id } = req.params;
    const { position, title, fullName, linkedinLink } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid board member ID' });
    }

    const member = await BoardOfDirector.findById(id);

    if (!member) {
      return res.status(404).json({ message: 'Board member not found' });
    }

    const updateData = {
      position: position ? parseInt(position) : member.position,
      title,
      fullName,
      linkedinLink: linkedinLink || ''
    };

    // If a new image was uploaded
    if (req.file) {
      // Remove old file
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

      updateData.photo = buildImageUrl(req, req.file.filename);
    }

    const updatedMember = await BoardOfDirector.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    res.status(200).json({
      message: 'Board member updated successfully',
      member: updatedMember
    });

  } catch (error) {
    console.error(error);
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
