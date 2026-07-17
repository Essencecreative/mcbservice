const express = require('express');
const router = express.Router();
const BrandSection = require('../models/BrandSection');
const upload = require('../middlewares/upload');
const cloudinary = require('../utils/cloudinary');
const authMiddleware = require('../middlewares/authMiddleware');

// Helper to get or create the singleton document
async function getSingleton() {
  let section = await BrandSection.findOne();
  if (!section) {
    section = new BrandSection({
      title: "We make your brand stand out!",
      image: "https://res.cloudinary.com/dedfrilse/image/upload/v1652416077/476_652px-01.jpg",
      features: [
        {
          iconClass: "line-icon-Cursor-Click2",
          subtitle: "Creative Marketing",
          description: "Stand out in the market with our digital marketing strategy"
        },
        {
          iconClass: "line-icon-Sand-watch",
          subtitle: "Contents Creation",
          description: "Get the best contents design for your brand marketing"
        },
        {
          iconClass: "line-icon-Idea-2",
          subtitle: "Branding & Design",
          description: "Let us assist you in your business branding design needs"
        }
      ]
    });
    await section.save();
  }
  return section;
}

// Get the brand section settings
router.get('/', async (req, res) => {
  try {
    const section = await getSingleton();
    res.json(section);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update the brand section settings
router.put('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const section = await getSingleton();
    
    if (req.body.title) {
      section.title = req.body.title;
    }

    if (req.body.features) {
      try {
        // features will be sent as a stringified JSON array if multipart/form-data
        const parsedFeatures = typeof req.body.features === 'string' ? JSON.parse(req.body.features) : req.body.features;
        if (Array.isArray(parsedFeatures)) {
          section.features = parsedFeatures;
        }
      } catch (e) {
        return res.status(400).json({ message: 'Invalid features format' });
      }
    }

    if (req.file) {
      const dataURI = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const response = await cloudinary.uploader.upload(dataURI, { folder: 'essence/brandsection' });
      section.image = response.secure_url;
    }

    const updatedSection = await section.save();
    res.json(updatedSection);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
