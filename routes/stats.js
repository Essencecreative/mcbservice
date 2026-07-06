const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

const Project = require('../models/Project');
const Client = require('../models/Client');
const TeamMember = require('../models/TeamMember');
const Testimonial = require('../models/Testimonial');
const Category = require('../models/Category');

router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const projectsCount = await Project.countDocuments();
    const clientsCount = await Client.countDocuments();
    const teamCount = await TeamMember.countDocuments();
    const testimonialsCount = await Testimonial.countDocuments();
    const categoriesCount = await Category.countDocuments();

    // Recharts mock data since we don't have historical creation tracking setup extensively yet
    const generateMockTrends = (count) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      return months.map(m => ({ month: m, count: Math.floor(Math.random() * count) }));
    };

    res.json({
      projects: { total: projectsCount, thisMonth: 0, trends: generateMockTrends(projectsCount + 5) },
      clients: { total: clientsCount, thisMonth: 0, trends: generateMockTrends(clientsCount + 5) },
      team: { total: teamCount, thisMonth: 0, trends: generateMockTrends(teamCount + 5) },
      testimonials: { total: testimonialsCount, thisMonth: 0, trends: generateMockTrends(testimonialsCount + 5) },
      categories: { total: categoriesCount, thisMonth: 0, trends: generateMockTrends(categoriesCount + 5) }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
