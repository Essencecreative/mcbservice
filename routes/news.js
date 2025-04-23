const express = require('express');
const mongoose = require('mongoose');
const News = require('../models/news');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

// POST /news - Create news/update
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, category, description, publicationDate, contentDescription } = req.body;

    const newNews = new News({
      title,
      category,
      description,
      publicationDate: publicationDate ? new Date(publicationDate) : undefined,
      contentDescription,
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
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, category, description, publicationDate, contentDescription } = req.body;

    const updatedNews = await News.findByIdAndUpdate(
      req.params.id,
      {
        title,
        category,
        description,
        publicationDate: publicationDate ? new Date(publicationDate) : undefined,
        contentDescription,
      },
      { new: true }
    );

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
