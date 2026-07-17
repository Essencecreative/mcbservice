const express = require('express');
const router = express.Router();
const Solution = require('../models/Solution');
const upload = require('../middlewares/upload');
const cloudinary = require('../utils/cloudinary');
const authMiddleware = require('../middlewares/authMiddleware');

// Get all solutions
router.get('/', async (req, res) => {
  try {
    const solutions = await Solution.find().sort({ order: 1 });
    res.json(solutions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single solution
router.get('/:id', async (req, res) => {
  try {
    const solution = await Solution.findById(req.params.id);
    if (!solution) return res.status(404).json({ message: 'Solution not found' });
    res.json(solution);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create solution
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const dataURI = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const response = await cloudinary.uploader.upload(dataURI, { folder: 'essence/solutions' });

    const solution = new Solution({
      ...req.body,
      image: response.secure_url,
    });

    const savedSolution = await solution.save();
    res.status(201).json(savedSolution);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update solution
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      const dataURI = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const response = await cloudinary.uploader.upload(dataURI, { folder: 'essence/solutions' });
      updateData.image = response.secure_url;
    }

    const updatedSolution = await Solution.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.json(updatedSolution);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete solution
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Solution.findByIdAndDelete(req.params.id);
    res.json({ message: 'Solution deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
