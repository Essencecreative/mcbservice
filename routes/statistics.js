const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authMiddleware');

const News = require('../models/news');
const Opportunity = require("../models/Opportunity");
const Publication = require('../models/Publication');
const Team = require('../models/team');

function getMonthlyAggregation(model) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1); // start of the month

  return model.aggregate([
    {
      $match: {
        createdAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 }
    }
  ]);
}

router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const [
      totalNews, monthlyNews, newsTrends,
      totalOpportunities, monthlyOpportunities, opportunityTrends,
      totalPublications, monthlyPublications, publicationTrends,
      totalTeam, monthlyTeam, teamTrends
    ] = await Promise.all([
      News.countDocuments(),
      News.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      getMonthlyAggregation(News),

      Opportunity.countDocuments(),
      Opportunity.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      getMonthlyAggregation(Opportunity),

      Publication.countDocuments(),
      Publication.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      getMonthlyAggregation(Publication),

      Team.countDocuments(),
      Team.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      getMonthlyAggregation(Team),
    ]);

    const formatTrends = (data) =>
      data.map(({ _id, count }) => ({
        month: `${_id.year}-${String(_id.month).padStart(2, '0')}`,
        count,
      }));

    res.status(200).json({
      news: { total: totalNews, thisMonth: monthlyNews, trends: formatTrends(newsTrends) },
      opportunities: { total: totalOpportunities, thisMonth: monthlyOpportunities, trends: formatTrends(opportunityTrends) },
      publications: { total: totalPublications, thisMonth: monthlyPublications, trends: formatTrends(publicationTrends) },
      team: { total: totalTeam, thisMonth: monthlyTeam, trends: formatTrends(teamTrends) },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch dashboard summary' });
  }
});

module.exports = router;
