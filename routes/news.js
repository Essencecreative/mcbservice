const express = require('express');
const mongoose = require('mongoose');
const News = require('../models/news');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');

const router = express.Router();

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload helper
const streamUpload = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'publications',
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(fileBuffer);
  });
};


// POST /news - Create news/update
router.post('/', authenticateToken,  upload.single("photo"), async (req, res) => {
  try {
    const { title, category, description, publicationDate, contentDescription } = req.body;

    let photoUrl = "";
    if (req.file) {
      const uploadResult = await streamUpload(req.file.buffer);
      photoUrl = uploadResult.secure_url;
    }

    const newNews = new News({
      title,
      category,
      description,
      publicationDate: publicationDate ? new Date(publicationDate) : undefined,
      contentDescription,
      photo: photoUrl,
    });

    await newNews.save();

    res.status(200).json({ message: 'News/Update created successfully', news: newNews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create news/update' });
  }
});

// GET /news - Fetch paginated news/updates
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, sortBy = 'publicationDate', sortOrder = 'desc' } = req.query;

    const query = {};
    if (category) query.category = category;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const newsList = await News.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalCount = await News.countDocuments(query);

    res.status(200).json({
      news: newsList,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch news/updates' });
  }
});

// PUT /news/:id - Update news/update
router.put('/:id', authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, description, publicationDate, contentDescription } = req.body;

    const updateData = {
      title,
      category,
      description,
      publicationDate: new Date(publicationDate),
      contentDescription,
    };

    if (req.file) {
      const uploadResult = await streamUpload(req.file.buffer);
      updateData.photo = uploadResult.secure_url;
    }

    const updatedNews = await News.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedNews) {
      return res.status(404).json({ message: 'News/Update not found' });
    }

    res.status(200).json({ message: 'News/Update updated successfully', news: updatedNews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update news/update' });
  }
});

// DELETE /news/:id - Delete news/update
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deletedNews = await News.findByIdAndDelete(req.params.id);

    if (!deletedNews) {
      return res.status(404).json({ message: 'News/Update not found' });
    }

    res.status(200).json({ message: 'News/Update deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete news/update' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const New = await News.findById(id);
  
      if (!New) {
        return res.status(404).json({ message: 'News not found' });
      }
  
      res.status(200).json(New);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch News' });
    }
  });

module.exports = router;
