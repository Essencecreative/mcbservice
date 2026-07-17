const express = require('express');
const router = express.Router();
const MarketingStrategy = require('../models/MarketingStrategy');
const upload = require('../middlewares/upload');
const cloudinary = require('../utils/cloudinary');
const authMiddleware = require('../middlewares/authMiddleware');

// Helper to get or create the singleton document
async function getSingleton() {
  let section = await MarketingStrategy.findOne();
  if (!section) {
    section = new MarketingStrategy(); // Uses the defaults defined in the schema
    await section.save();
  }
  return section;
}

// Get the marketing strategy settings
router.get('/', async (req, res) => {
  try {
    const section = await getSingleton();
    res.json(section);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update the marketing strategy settings
router.put('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const section = await getSingleton();
    
    if (req.body.title) section.title = req.body.title;
    if (req.body.subtitle) section.subtitle = req.body.subtitle;
    if (req.body.description) section.description = req.body.description;

    if (req.file) {
      const dataURI = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const response = await cloudinary.uploader.upload(dataURI, { folder: 'essence/marketing' });
      section.image = response.secure_url;
    }

    const updatedSection = await section.save();
    res.json(updatedSection);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
