const express = require('express');
const mongoose = require('mongoose');
const HeaderUpdate = require('../models/HeaderUpdate');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

// POST /header-update - Create header update
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { text, link, isActive } = req.body;

    // If setting this as active, deactivate all others
    if (isActive) {
      await HeaderUpdate.updateMany({}, { isActive: false });
    }

    const newUpdate = new HeaderUpdate({
      text,
      link: link || '',
      isActive: isActive !== undefined ? isActive : true,
    });

    await newUpdate.save();

    res.status(201).json({ 
      message: 'Header update created successfully', 
      update: newUpdate 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create header update' });
  }
});

// GET /header-update - Fetch all header updates
router.get('/', async (req, res) => {
  try {
    const updates = await HeaderUpdate.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      updates,
      totalCount: updates.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch header updates' });
  }
});

// GET /header-update/active - Get active header update (for frontend)
router.get('/active', async (req, res) => {
  try {
    const update = await HeaderUpdate.findOne({ isActive: true })
      .sort({ createdAt: -1 });

    if (!update) {
      return res.status(200).json({ update: null });
    }

    res.status(200).json({ update });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch active header update' });
  }
});

// GET /header-update/:id - Fetch single header update
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid header update ID' });
    }

    const update = await HeaderUpdate.findById(id);

    if (!update) {
      return res.status(404).json({ message: 'Header update not found' });
    }

    res.status(200).json(update);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch header update' });
  }
});

// PUT /header-update/:id - Update header update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, link, isActive } = req.body;

    const update = await HeaderUpdate.findById(id);
    if (!update) {
      return res.status(404).json({ message: 'Header update not found' });
    }

    // If setting this as active, deactivate all others
    if (isActive && !update.isActive) {
      await HeaderUpdate.updateMany({ _id: { $ne: id } }, { isActive: false });
    }

    const updateData = {
      text,
      link: link || '',
    };

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const updatedUpdate = await HeaderUpdate.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({ 
      message: 'Header update updated successfully', 
      update: updatedUpdate 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update header update' });
  }
});

// DELETE /header-update/:id - Delete header update
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const update = await HeaderUpdate.findById(req.params.id);
    if (!update) {
      return res.status(404).json({ message: 'Header update not found' });
    }

    await HeaderUpdate.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Header update deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete header update' });
  }
});

module.exports = router;

