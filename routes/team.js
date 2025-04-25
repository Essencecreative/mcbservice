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

// POST /team/create-team-member - Create new team member
router.post(
  "/create-team-member",
  authenticateToken,
  upload.single("photo"),
  async (req, res) => {
    try {
      const { name, jobTitle, team, biography } = req.body;

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

// GET /team - Get all team members
router.get('/', async (req, res) => {
  try {
    const users = await Team.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// PUT /team/:id - Update team member
router.put('/:id', authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    const { name, jobTitle, team, biography } = req.body;

    let updateData = {
      username: name,
      jobTitle,
      team,
      biography,
    };

    if (req.file) {
      const result = await streamUpload(req.file.buffer);
      updateData.photo = result.secure_url;
    }

    const updatedUser = await Team.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    res.status(200).json({ message: 'Team member updated', user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update team member', error: error.message });
  }
});

// DELETE /team/:id - Delete team member
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await Team.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    res.status(200).json({ message: 'Team member deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete team member', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const team = await Team.findById(id);
  
      if (!team) {
        return res.status(404).json({ message: 'teams not found' });
      }
  
      res.status(200).json(team);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch teams' });
    }
  });

module.exports = router;
