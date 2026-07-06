const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');
const upload = require('../middlewares/upload');
const cloudinary = require('../utils/cloudinary');
const authMiddleware = require('../middlewares/authMiddleware');

// Get all testimonials
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a testimonial
router.post('/', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const { authorName, quote, company } = req.body;
    let avatarUrl = null;

    if (req.file) {
      const dataURI = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const uploadResponse = await cloudinary.uploader.upload(dataURI, {
        folder: 'essence/testimonials',
      });
      avatarUrl = uploadResponse.secure_url;
    }

    const newTestimonial = new Testimonial({
      authorName,
      quote,
      company,
      avatarUrl,
    });

    const savedTestimonial = await newTestimonial.save();
    res.status(201).json(savedTestimonial);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a testimonial
router.put('/:id', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const { authorName, authorRole, company, quote } = req.body;
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });

    if (authorName) testimonial.authorName = authorName;
    if (authorRole !== undefined) testimonial.authorRole = authorRole;
    if (company !== undefined) testimonial.company = company;
    if (quote) testimonial.quote = quote;

    if (req.file) {
      const dataURI = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const uploadResponse = await cloudinary.uploader.upload(dataURI, {
        folder: 'essence/testimonials',
      });
      testimonial.avatarUrl = uploadResponse.secure_url;
    }

    const updatedTestimonial = await testimonial.save();
    res.json(updatedTestimonial);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a testimonial
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }
    res.json({ message: 'Testimonial deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
