const express = require('express');
const router = express.Router();
const YoutubeVideo = require('../models/YoutubeVideo');
const authenticateToken = require('../middlewares/authMiddleware');

// GET /youtube-videos - Get all active YouTube videos sorted by position
router.get('/', async (req, res) => {
  try {
    const videos = await YoutubeVideo.find({ isActive: true })
      .sort({ position: 1, createdAt: -1 });
    
    res.json({ videos });
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    res.status(500).json({ message: 'Failed to fetch YouTube videos' });
  }
});

// GET /youtube-videos/all - Get all YouTube videos (including inactive) - requires auth
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 100, sortBy = 'position', sortOrder = 'asc' } = req.query;
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const videos = await YoutubeVideo.find()
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    
    const totalCount = await YoutubeVideo.countDocuments();
    
    res.json({ 
      videos,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page)
    });
  } catch (error) {
    console.error('Error fetching all YouTube videos:', error);
    res.status(500).json({ message: 'Failed to fetch all YouTube videos' });
  }
});

// GET /youtube-videos/:id - Get single YouTube video
router.get('/:id', async (req, res) => {
  try {
    const video = await YoutubeVideo.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'YouTube video not found' });
    }
    
    res.json({ video });
  } catch (error) {
    console.error('Error fetching YouTube video:', error);
    res.status(500).json({ message: 'Failed to fetch YouTube video' });
  }
});

// POST /youtube-videos - Create new YouTube video (requires auth)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, youtubeId, category, position, isActive } = req.body;
    
    if (!title || !youtubeId) {
      return res.status(400).json({ message: 'Title and YouTube ID are required' });
    }

    const newVideo = new YoutubeVideo({
      title,
      description,
      youtubeId,
      category,
      position: position !== undefined ? position : 0,
      isActive: isActive !== undefined ? isActive : true,
    });
    
    await newVideo.save();
    
    res.status(201).json({ 
      message: 'YouTube video created successfully',
      video: newVideo 
    });
  } catch (error) {
    console.error('Error creating YouTube video:', error);
    res.status(500).json({ message: 'Failed to create YouTube video' });
  }
});

// PUT /youtube-videos/:id - Update YouTube video (requires auth)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, youtubeId, category, position, isActive } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (youtubeId !== undefined) updateData.youtubeId = youtubeId;
    if (category !== undefined) updateData.category = category;
    if (position !== undefined) updateData.position = position;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const updatedVideo = await YoutubeVideo.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedVideo) {
      return res.status(404).json({ message: 'YouTube video not found' });
    }
    
    res.json({ 
      message: 'YouTube video updated successfully',
      video: updatedVideo 
    });
  } catch (error) {
    console.error('Error updating YouTube video:', error);
    res.status(500).json({ message: 'Failed to update YouTube video' });
  }
});

// DELETE /youtube-videos/:id - Delete YouTube video (requires auth)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deletedVideo = await YoutubeVideo.findByIdAndDelete(req.params.id);
    
    if (!deletedVideo) {
      return res.status(404).json({ message: 'YouTube video not found' });
    }
    
    res.json({ message: 'YouTube video deleted successfully' });
  } catch (error) {
    console.error('Error deleting YouTube video:', error);
    res.status(500).json({ message: 'Failed to delete YouTube video' });
  }
});

module.exports = router;
