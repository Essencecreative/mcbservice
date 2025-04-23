const express = require('express');
const mongoose = require('mongoose');
const Publication = require('../models/Publication'); // Assuming you have a Mongoose model defined for publication
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

// Route to create a new publication
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, category, description, newsAndEvents, publicationDate, contentDescription } = req.body;

    // Create a new Publication
    const newPublication = new Publication({
      title,
      category,
      description,
      newsAndEvents,
      publicationDate: new Date(publicationDate),
      contentDescription, // Storing Markdown as string
    });

    await newPublication.save();

    res.status(200).json({ message: 'Publication created successfully', publication: newPublication });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create publication' });
  }
});

// Route to fetch publications
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get query parameters for pagination and sorting
    const { page = 1, limit = 10, category, sortBy = 'publicationDate', sortOrder = 'desc' } = req.query;

    // Build query object
    const query = {};

    // If category is provided, filter by category
    if (category) {
      query.category = category;
    }

    // Sort by the provided field and order
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Fetch the publications with pagination and sorting
    const publications = await Publication.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Get the total count of publications to return pagination metadata
    const totalCount = await Publication.countDocuments(query);

    res.status(200).json({
      publications,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch publications' });
  }
});

module.exports = router;
