const express = require('express');
const router = express.Router();
const TeamMember = require('../models/TeamMember');
const upload = require('../middlewares/upload');
const cloudinary = require('../utils/cloudinary');
const authMiddleware = require('../middlewares/authMiddleware');

// Get all team members
router.get('/', async (req, res) => {
  try {
    const team = await TeamMember.find().sort({ createdAt: -1 });
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a team member
router.post('/', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const { name, role, bio } = req.body;
    let avatarUrl = null;

    if (req.file) {
      const dataURI = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const uploadResponse = await cloudinary.uploader.upload(dataURI, {
        folder: 'essence/team',
      });
      avatarUrl = uploadResponse.secure_url;
    }

    const newMember = new TeamMember({
      name,
      role,
      bio,
      avatarUrl,
    });

    const savedMember = await newMember.save();
    res.status(201).json(savedMember);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a team member
router.put('/:id', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const { name, role, bio } = req.body;
    const teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) return res.status(404).json({ message: 'Team member not found' });

    if (name) teamMember.name = name;
    if (role) teamMember.role = role;
    if (bio !== undefined) teamMember.bio = bio;

    if (req.file) {
      const dataURI = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const uploadResponse = await cloudinary.uploader.upload(dataURI, {
        folder: 'essence/team',
      });
      teamMember.avatarUrl = uploadResponse.secure_url;
    }

    const updatedTeamMember = await teamMember.save();
    res.json(updatedTeamMember);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a team member
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndDelete(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Team member not found' });
    }
    res.json({ message: 'Team member deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
