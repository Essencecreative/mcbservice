const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const upload = require('../middlewares/upload');
const cloudinary = require('../utils/cloudinary');
const authMiddleware = require('../middlewares/authMiddleware');

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().populate('category').populate('client').sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('category').populate('client');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a project
const cpUpload = upload.fields([
  { name: 'bannerPhoto', maxCount: 1 },
  { name: 'miniPhoto', maxCount: 1 },
  { name: 'quotePhoto', maxCount: 1 },
  { name: 'gallery', maxCount: 10 },
  { name: 'image', maxCount: 1 } // legacy
]);

router.post('/', authMiddleware, cpUpload, async (req, res) => {
  try {
    const { 
      title, description, category, client,
      clientName, services, industry, projectBrief, 
      solutionBrief, projectLink, quoteDescription, quoteTitle 
    } = req.body;

    const newProject = new Project({
      title, description, category, client,
      clientName, services, industry, projectBrief, 
      solutionBrief, projectLink, quoteDescription, quoteTitle,
      gallery: [], imageUrls: []
    });

    const uploadToCloudinary = async (file) => {
      const dataURI = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const response = await cloudinary.uploader.upload(dataURI, { folder: 'essence/projects' });
      return response.secure_url;
    };

    if (req.files) {
      if (req.files['bannerPhoto']) newProject.bannerPhoto = await uploadToCloudinary(req.files['bannerPhoto'][0]);
      if (req.files['miniPhoto']) newProject.miniPhoto = await uploadToCloudinary(req.files['miniPhoto'][0]);
      if (req.files['quotePhoto']) newProject.quotePhoto = await uploadToCloudinary(req.files['quotePhoto'][0]);
      if (req.files['image']) {
        const url = await uploadToCloudinary(req.files['image'][0]);
        newProject.imageUrls.push(url);
      }
      if (req.files['gallery']) {
        for (const file of req.files['gallery']) {
          newProject.gallery.push(await uploadToCloudinary(file));
        }
      }
    }

    const savedProject = await newProject.save();
    res.status(201).json(savedProject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a project
router.put('/:id', authMiddleware, cpUpload, async (req, res) => {
  try {
    const { 
      title, description, category, client,
      clientName, services, industry, projectBrief, 
      solutionBrief, projectLink, quoteDescription, quoteTitle,
      removeBannerPhoto, removeMiniPhoto, removeQuotePhoto, existingGallery
    } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (title) project.title = title;
    if (description) project.description = description;
    if (category) project.category = category;
    if (client) project.client = client;
    if (clientName !== undefined) project.clientName = clientName;
    if (services !== undefined) project.services = services;
    if (industry !== undefined) project.industry = industry;
    if (projectBrief !== undefined) project.projectBrief = projectBrief;
    if (solutionBrief !== undefined) project.solutionBrief = solutionBrief;
    if (projectLink !== undefined) project.projectLink = projectLink;
    if (quoteDescription !== undefined) project.quoteDescription = quoteDescription;
    if (quoteTitle !== undefined) project.quoteTitle = quoteTitle;

    if (removeBannerPhoto === 'true') project.bannerPhoto = '';
    if (removeMiniPhoto === 'true') project.miniPhoto = '';
    if (removeQuotePhoto === 'true') project.quotePhoto = '';

    if (existingGallery !== undefined) {
      try {
        project.gallery = JSON.parse(existingGallery);
      } catch (e) {
        // If it's not valid JSON, it might be an array or string
        if (Array.isArray(existingGallery)) {
          project.gallery = existingGallery;
        } else if (typeof existingGallery === 'string' && existingGallery !== '') {
          project.gallery = [existingGallery];
        } else {
          project.gallery = [];
        }
      }
    }

    const uploadToCloudinary = async (file) => {
      const dataURI = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const response = await cloudinary.uploader.upload(dataURI, { folder: 'essence/projects' });
      return response.secure_url;
    };

    if (req.files) {
      if (req.files['bannerPhoto']) project.bannerPhoto = await uploadToCloudinary(req.files['bannerPhoto'][0]);
      if (req.files['miniPhoto']) project.miniPhoto = await uploadToCloudinary(req.files['miniPhoto'][0]);
      if (req.files['quotePhoto']) project.quotePhoto = await uploadToCloudinary(req.files['quotePhoto'][0]);
      if (req.files['image']) {
        const url = await uploadToCloudinary(req.files['image'][0]);
        if (!project.imageUrls) project.imageUrls = [];
        project.imageUrls.push(url);
      }
      if (req.files['gallery']) {
        if (!project.gallery) project.gallery = [];
        for (const file of req.files['gallery']) {
          project.gallery.push(await uploadToCloudinary(file));
        }
      }
    }

    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a project
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
