const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const authenticateToken = require("../middlewares/authMiddleware");
const router = express.Router();

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });
// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary upload helper (buffer-based stream)
const streamUpload = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "team-members",
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(fileBuffer);
  });
};


// Route to create a user with a specific role
router.post('/', authenticateToken, async (req, res) => {
  const { username, password, role } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create a new user with the provided role
    const newUser = new User({ username, password, role: role || 'editor' });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Route: Create new team member with image
router.post(
  "/create-team-member",
  authenticateToken,
  upload.single("photo"), // multer handles file
  async (req, res) => {
    try {
      const {
        name,
        password
      } = req.body;

      // Prevent duplicate email
      const existingUser = await User.findOne({ username: name });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      let photoUrl = "";
      if (req.file) {
        const uploadResult = await streamUpload(req.file.buffer);
        photoUrl = uploadResult.secure_url;
      }

      const newUser = new User({
        username: name,
        photo: photoUrl,
        password,
        role: "editor",
      });

      await newUser.save();

      res.status(201).json({ message: "Team member created", user: newUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create team member", error: error.message });
    }
  }
);

// Route: Delete team member (only admin with username "admin" can delete)
router.delete(
    "/delete-team-member/:id",
    authenticateToken,  // This will authenticate and add user details to req.user
    async (req, res) => {
      try {
        // Check if the authenticated user is an admin and username is "admin"
        if (req.user.role !== "admin" || req.user.username !== "admin") {
          return res.status(403).json({ message: "Unauthorized: Only super admin can delete users" });
        }
  
        const { id } = req.params;
  
        // Find the user to delete by ID
        const userToDelete = await User.findById(id);
        if (!userToDelete) {
          return res.status(404).json({ message: "User not found" });
        }
  
        // Prevent deleting the super admin account itself
        if (userToDelete.username === "admin") {
          return res.status(400).json({ message: "Cannot delete the super admin account" });
        }
  
        // Proceed with deletion
        await User.findByIdAndDelete(id);
  
        res.status(200).json({ message: "Team member deleted successfully" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete team member", error: error.message });
      }
    }
  );
  


router.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      // Check if the user exists
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Check the password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid password' });
      }
  
      // Generate JWT
      const token = jwt.sign(
        {
          id: user._id,
          username: user.username,
          role: user.role,
          photo: user?.photo
        },
        process.env.JWT_SECRET || 'supersecretkey', // Use env var in production
        { expiresIn: '1d' } // expires in 1 day
      );
  
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
      res.status(500).json({ message: 'Error logging in', error: error.message });
    }
  });

// Route to get all users (for admin use)
router.get('/', authenticateToken, async (req, res) => {
    try {
      const users = await User.find({ username: { $ne: "admin" } });
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
  });
  

router.get('/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
  
      if (!user) {
        return res.status(404).json({ message: 'users not found' });
      }
  
      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  router.put('/:id', authenticateToken, upload.single("photo"), async (req, res) => {
    try {
      const { id } = req.params;
      const { username, password } = req.body;
  
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      // Check for username uniqueness (if it's being changed)
      if (username && username !== user.username) {
        const existing = await User.findOne({ username });
        if (existing) {
          return res.status(400).json({ message: "Username already in use" });
        }
        user.username = username;
      }
  
      if (password) {
        user.password = password; // assume User model hashes password in a pre-save hook
      }
  
      if (req.file) {
        const uploadResult = await streamUpload(req.file.buffer);
        user.photo = uploadResult.secure_url;
      }
  
      await user.save();
  
      res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user", error: error.message });
    }
  });

module.exports = router;
