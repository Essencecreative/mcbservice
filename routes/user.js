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
  const uploadStartTime = Date.now();
  try {
    console.log('\n' + '='.repeat(80));
    console.log('📸 [TEAM MEMBER PHOTO UPLOAD] POST /users/create-team-member - Creating new team member');
    console.log('─'.repeat(80));
    console.log('Request received at:', new Date().toISOString());
    console.log('User:', req.user ? { id: req.user.id || req.user.userId, username: req.user.username } : 'Not authenticated');

    const { name, password } = req.body;

    const existingUser = await User.findOne({ username: name });
    if (existingUser) {
      console.error('❌ [TEAM MEMBER PHOTO UPLOAD] Error: Username already in use');
      return res.status(400).json({ message: "Username already in use" });
    }

    let photoUrl = '';
    if (req.file) {
      console.log('📁 [TEAM MEMBER PHOTO UPLOAD] Photo file received:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: `${(req.file.size / 1024).toFixed(2)} KB`,
        path: req.file.path
      });

      // Verify file exists
      try {
        await fs.access(req.file.path);
        console.log('✅ [TEAM MEMBER PHOTO UPLOAD] File verified at path:', req.file.path);
      } catch (accessError) {
        console.error('❌ [TEAM MEMBER PHOTO UPLOAD] Error: File does not exist at path:', req.file.path);
        throw new Error(`Uploaded file not found: ${accessError.message}`);
      }

      console.log('🔗 [TEAM MEMBER PHOTO UPLOAD] Building photo URL...');
      photoUrl = buildFileUrl(req, req.file.path);
      console.log('✅ [TEAM MEMBER PHOTO UPLOAD] Photo URL built:', photoUrl);
    } else {
      console.log('ℹ️  [TEAM MEMBER PHOTO UPLOAD] No photo provided');
    }

    console.log('💾 [TEAM MEMBER PHOTO UPLOAD] Creating team member with username:', name);

    const newUser = new User({
      username: name,
      password,
      photo: photoUrl,
      role: 'editor'
    });

    await newUser.save();
    const uploadTime = Date.now() - uploadStartTime;

    console.log('✅ [TEAM MEMBER PHOTO UPLOAD] Team member created successfully');
    console.log('📊 [TEAM MEMBER PHOTO UPLOAD] Upload completed in:', `${uploadTime}ms`);
    console.log('📝 [TEAM MEMBER PHOTO UPLOAD] User ID:', newUser._id);
    console.log('='.repeat(80) + '\n');

    res.status(201).json({ message: "Team member created", user: newUser });
  } catch (error) {
    const uploadTime = Date.now() - uploadStartTime;
    console.error('❌ [TEAM MEMBER PHOTO UPLOAD] Error details:', {
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
        console.log('🧹 [TEAM MEMBER PHOTO UPLOAD] Cleaned up file after error:', req.file.path);
      } catch (unlinkError) {
        console.error('❌ [TEAM MEMBER PHOTO UPLOAD] Failed to clean up file:', unlinkError);
      }
    }
    
    console.log('='.repeat(80) + '\n');
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
  const uploadStartTime = Date.now();
  try {
    const { id } = req.params;
    const { username, password } = req.body;

    console.log('\n' + '='.repeat(80));
    console.log('📸 [USER PHOTO UPLOAD] PUT /users/:id - Updating user');
    console.log('─'.repeat(80));
    console.log('Request received at:', new Date().toISOString());
    console.log('User ID:', id);
    console.log('User:', req.user ? { id: req.user.id || req.user.userId, username: req.user.username } : 'Not authenticated');

    const user = await User.findById(id);
    if (!user) {
      console.error('❌ [USER PHOTO UPLOAD] Error: User not found');
      return res.status(404).json({ message: "User not found" });
    }

    console.log('✅ [USER PHOTO UPLOAD] User found');

    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) {
        console.error('❌ [USER PHOTO UPLOAD] Error: Username already in use');
        return res.status(400).json({ message: "Username already in use" });
      }
      user.username = username;
    }

    if (password) user.password = password;

    if (req.file) {
      console.log('📁 [USER PHOTO UPLOAD] New photo file received:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: `${(req.file.size / 1024).toFixed(2)} KB`,
        path: req.file.path
      });

      // Delete old photo if exists
      if (user.photo) {
        const photoPath = path.join(__dirname, '..', 'uploads', 'team-members', path.basename(user.photo));
        console.log('🗑️  [USER PHOTO UPLOAD] Deleting old photo:', photoPath);
        try {
          await fs.unlink(photoPath);
          console.log('✅ [USER PHOTO UPLOAD] Old photo deleted successfully');
        } catch (unlinkError) {
          console.warn('⚠️  [USER PHOTO UPLOAD] Could not delete old photo (may not exist):', unlinkError.message);
        }
      }

      // Verify new file exists
      try {
        await fs.access(req.file.path);
        console.log('✅ [USER PHOTO UPLOAD] New file verified at path:', req.file.path);
      } catch (accessError) {
        console.error('❌ [USER PHOTO UPLOAD] Error: New file does not exist at path:', req.file.path);
        throw new Error(`Uploaded file not found: ${accessError.message}`);
      }

      console.log('🔗 [USER PHOTO UPLOAD] Building new photo URL...');
      user.photo = buildFileUrl(req, req.file.path);
      console.log('✅ [USER PHOTO UPLOAD] New photo URL built:', user.photo);
    } else {
      console.log('ℹ️  [USER PHOTO UPLOAD] No new photo provided, keeping existing photo');
    }

    console.log('💾 [USER PHOTO UPLOAD] Updating user...');
    await user.save();

    const uploadTime = Date.now() - uploadStartTime;
    console.log('✅ [USER PHOTO UPLOAD] User updated successfully');
    console.log('📊 [USER PHOTO UPLOAD] Update completed in:', `${uploadTime}ms`);
    console.log('='.repeat(80) + '\n');

    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    const uploadTime = Date.now() - uploadStartTime;
    console.error('❌ [USER PHOTO UPLOAD] Error details:', {
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
        console.log('🧹 [USER PHOTO UPLOAD] Cleaned up file after error:', req.file.path);
      } catch (unlinkError) {
        console.error('❌ [USER PHOTO UPLOAD] Failed to clean up file:', unlinkError);
      }
    }
    
    console.log('='.repeat(80) + '\n');
    res.status(500).json({ message: "Failed to update user", error: error.message });
  }
});

module.exports = router;
