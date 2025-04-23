const express = require('express');
const mongoose = require('mongoose');
const News = require('../models/news'); // Updated to use News model
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

// Route to create a new news/update entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, category, description, publicationDate, contentDescription } = req.body;

    // Create a new News document
    const newNews = new News({
      title,
      category,
      description,
      publicationDate: publicationDate ? new Date(publicationDate) : undefined,
      contentDescription, // Markdown stored as string
    });

    await newNews.save();

    res.status(200).json({ message: 'News/Update created successfully', news: newNews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create news/update' });
  }
});

// Route to fetch news/updates
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, sortBy = 'publicationDate', sortOrder = 'desc' } = req.query;

    const query = {};
    if (category) {
      query.category = category;
    }

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

module.exports = router;
