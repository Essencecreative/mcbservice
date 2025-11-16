const express = require('express');
const router = express.Router();
const Wakala = require('../models/Wakala');
const authenticateToken = require('../middlewares/authMiddleware');

// GET /wakala - Get all active wakala locations
router.get('/', async (req, res) => {
  try {
    const { region, district } = req.query;
    
    const query = { isActive: true };
    if (region) query.region = region;
    if (district) query.district = district;
    
    const wakalas = await Wakala.find(query)
      .sort({ region: 1, district: 1, name: 1 });
    
    res.json({ wakalas });
  } catch (error) {
    console.error('Error fetching wakala locations:', error);
    res.status(500).json({ message: 'Failed to fetch wakala locations' });
  }
});

// GET /wakala/all - Get all wakala locations (including inactive) - requires auth
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const wakalas = await Wakala.find()
      .sort({ region: 1, district: 1, name: 1 });
    
    res.json({ wakalas });
  } catch (error) {
    console.error('Error fetching wakala locations:', error);
    res.status(500).json({ message: 'Failed to fetch wakala locations' });
  }
});

// GET /wakala/:id - Get single wakala location
router.get('/:id', async (req, res) => {
  try {
    const wakala = await Wakala.findById(req.params.id);
    
    if (!wakala) {
      return res.status(404).json({ message: 'Wakala location not found' });
    }
    
    res.json({ wakala });
  } catch (error) {
    console.error('Error fetching wakala location:', error);
    res.status(500).json({ message: 'Failed to fetch wakala location' });
  }
});

// POST /wakala - Create new wakala location (requires auth)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, region, district, address, phone, isActive } = req.body;
    
    const newWakala = new Wakala({
      name,
      region,
      district,
      address,
      phone,
      isActive: isActive !== undefined ? isActive : true,
    });
    
    await newWakala.save();
    
    res.status(201).json({ 
      message: 'Wakala location created successfully',
      wakala: newWakala 
    });
  } catch (error) {
    console.error('Error creating wakala location:', error);
    res.status(500).json({ message: 'Failed to create wakala location' });
  }
});

// PUT /wakala/:id - Update wakala location (requires auth)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, region, district, address, phone, isActive } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (region) updateData.region = region;
    if (district) updateData.district = district;
    if (address) updateData.address = address;
    if (phone) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const updatedWakala = await Wakala.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedWakala) {
      return res.status(404).json({ message: 'Wakala location not found' });
    }
    
    res.json({ 
      message: 'Wakala location updated successfully',
      wakala: updatedWakala 
    });
  } catch (error) {
    console.error('Error updating wakala location:', error);
    res.status(500).json({ message: 'Failed to update wakala location' });
  }
});

// DELETE /wakala/:id - Delete wakala location (requires auth)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deletedWakala = await Wakala.findByIdAndDelete(req.params.id);
    
    if (!deletedWakala) {
      return res.status(404).json({ message: 'Wakala location not found' });
    }
    
    res.json({ message: 'Wakala location deleted successfully' });
  } catch (error) {
    console.error('Error deleting wakala location:', error);
    res.status(500).json({ message: 'Failed to delete wakala location' });
  }
});

module.exports = router;

