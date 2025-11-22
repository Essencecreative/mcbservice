// routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const authenticateToken = require('../middlewares/authMiddleware');
const { buildImageUrl: buildImageUrlUtil } = require('../utils/imageUrl');

const router = express.Router();

// Multer disk storage for local uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'team-members');
    fs.mkdir(uploadPath, { recursive: true })
      .then(() => cb(null, uploadPath))
      .catch(err => cb(err));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Helper to build full URL for uploaded file
const buildFileUrl = (req, filename) => {
  return buildImageUrlUtil(req, `uploads/team-members/${path.basename(filename)}`);
};

// Route to create a user with a specific role
router.post('/', authenticateToken, async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const newUser = new User({ username, password, role: role || 'editor' });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Route: Create new team member with photo
router.post('/create-team-member', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { name, password } = req.body;

    const existingUser = await User.findOne({ username: name });
    if (existingUser) return res.status(400).json({ message: "Username already in use" });

    let photoUrl = '';
    if (req.file) {
      photoUrl = buildFileUrl(req, req.file.path);
    }

    const newUser = new User({
      username: name,
      password,
      photo: photoUrl,
      role: 'editor'
    });

    await newUser.save();

    res.status(201).json({ message: "Team member created", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create team member", error: error.message });
  }
});

// Route: Delete team member (only super admin can delete)
router.delete('/delete-team-member/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' || req.user.username !== 'admin') {
      return res.status(403).json({ message: "Unauthorized: Only super admin can delete users" });
    }

    const { id } = req.params;
    const userToDelete = await User.findById(id);
    if (!userToDelete) return res.status(404).json({ message: "User not found" });

    if (userToDelete.username === 'admin') {
      return res.status(400).json({ message: "Cannot delete the super admin account" });
    }

    // Delete local photo if exists
    if (userToDelete.photo) {
      const photoPath = path.join(__dirname, '..', 'uploads', 'team-members', path.basename(userToDelete.photo));
      await fs.unlink(photoPath).catch(console.error);
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({ message: "Team member deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete team member", error: error.message });
  }
});

// User login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({
      id: user._id,
      username: user.username,
      role: user.role,
      photo: user?.photo
    }, process.env.JWT_SECRET || 'supersecretkey', { expiresIn: '1d' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        photo: user?.photo
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    // If middleware passed, token is valid
    // Optionally fetch fresh user data from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      valid: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        photo: user?.photo
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Error verifying token', error: error.message });
  }
});

// Get all users (except super admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({ username: { $ne: 'admin' } });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Get single user
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Update user
router.put('/:id', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) return res.status(400).json({ message: "Username already in use" });
      user.username = username;
    }

    if (password) user.password = password;

    if (req.file) {
      // Delete old photo if exists
      if (user.photo) {
        const photoPath = path.join(__dirname, '..', 'uploads', 'team-members', path.basename(user.photo));
        await fs.unlink(photoPath).catch(console.error);
      }
      user.photo = buildFileUrl(req, req.file.path);
    }

    await user.save();

    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Failed to update user", error: error.message });
  }
});

module.exports = router;
