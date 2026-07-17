const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const upload = require('../middlewares/upload');
const cloudinary = require('../utils/cloudinary');
const authMiddleware = require('../middlewares/authMiddleware');

// Get all banners
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: 1 });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single banner
router.get('/:id', async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    res.json(banner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a banner
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { description1, description2, buttonText, buttonLink, order } = req.body;
    let imageUrl = '';

    if (req.file) {
      const dataURI = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const response = await cloudinary.uploader.upload(dataURI, { folder: 'essence/banners' });
      imageUrl = response.secure_url;
    } else {
      return res.status(400).json({ message: 'Image is required for a banner' });
    }

    const newBanner = new Banner({
      image: imageUrl,
      description1,
      description2,
      buttonText,
      buttonLink,
      order: order ? parseInt(order, 10) : 0,
    });

    const savedBanner = await newBanner.save();
    res.status(201).json(savedBanner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a banner
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { description1, description2, buttonText, buttonLink, order } = req.body;
    const banner = await Banner.findById(req.params.id);
    
    if (!banner) return res.status(404).json({ message: 'Banner not found' });

    if (description1 !== undefined) banner.description1 = description1;
    if (description2 !== undefined) banner.description2 = description2;
    if (buttonText !== undefined) banner.buttonText = buttonText;
    if (buttonLink !== undefined) banner.buttonLink = buttonLink;
    if (order !== undefined) banner.order = parseInt(order, 10);

    if (req.file) {
      const dataURI = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const response = await cloudinary.uploader.upload(dataURI, { folder: 'essence/banners' });
      banner.image = response.secure_url;
    }

    const updatedBanner = await banner.save();
    res.json(updatedBanner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a banner
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    res.json({ message: 'Banner deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
