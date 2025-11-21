const express = require('express');
const router = express.Router();
const FAQ = require('../models/FAQ');
const authenticateToken = require('../middlewares/authMiddleware');

// GET /faqs - Get all active FAQs
router.get('/', async (req, res) => {
  try {
    const faqs = await FAQ.find({ isActive: true })
      .sort({ position: 1, createdAt: 1 });
    
    res.json({ faqs });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ message: 'Failed to fetch FAQs' });
  }
});

// GET /faqs/all - Get all FAQs (including inactive) - requires auth
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'position', sortOrder = 'asc' } = req.query;
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const faqs = await FAQ.find()
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    
    const totalCount = await FAQ.countDocuments();
    
    res.json({ 
      faqs,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page)
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ message: 'Failed to fetch FAQs' });
  }
});

// GET /faqs/:id - Get single FAQ
router.get('/:id', async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    
    res.json({ faq });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({ message: 'Failed to fetch FAQ' });
  }
});

// POST /faqs - Create new FAQ (requires auth)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { question, answer, position, isActive } = req.body;
    
    const newFAQ = new FAQ({
      question,
      answer,
      position: position !== undefined ? position : 0,
      isActive: isActive !== undefined ? isActive : true,
    });
    
    await newFAQ.save();
    
    res.status(201).json({ 
      message: 'FAQ created successfully',
      faq: newFAQ 
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ message: 'Failed to create FAQ' });
  }
});

// PUT /faqs/:id - Update FAQ (requires auth)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { question, answer, position, isActive } = req.body;
    
    const updateData = {};
    if (question) updateData.question = question;
    if (answer) updateData.answer = answer;
    if (position !== undefined) updateData.position = position;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const updatedFAQ = await FAQ.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedFAQ) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    
    res.json({ 
      message: 'FAQ updated successfully',
      faq: updatedFAQ 
    });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ message: 'Failed to update FAQ' });
  }
});

// DELETE /faqs/:id - Delete FAQ (requires auth)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deletedFAQ = await FAQ.findByIdAndDelete(req.params.id);
    
    if (!deletedFAQ) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    
    res.json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ message: 'Failed to delete FAQ' });
  }
});

module.exports = router;

