const express = require('express');
const Team = require('../models/team');
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


// Route: Create new team member with image
router.post(
  "/create-team-member",
  authenticateToken,
  upload.single("photo"), // multer handles file
  async (req, res) => {
    try {
      const {
        name,
        jobTitle,
        team,
        biography,
      } = req.body;

      // Prevent duplicate email

      let photoUrl = "";
      if (req.file) {
        const uploadResult = await streamUpload(req.file.buffer);
        photoUrl = uploadResult.secure_url;
      }

      const newUser = new Team({
        username: name,
        jobTitle,
        team,
        biography,
        photo: photoUrl,
      });

      await newUser.save();

      res.status(201).json({ message: "Team member created", user: newUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create team member", error: error.message });
    }
  }
);


// Route to get all users (for admin use)
router.get('/', async (req, res) => {
  try {
    const users = await Team.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

module.exports = router;
