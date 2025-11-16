const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authMiddleware');

const NewsAndUpdate = require('../models/NewsAndUpdate');
const InvestorNews = require('../models/InvestorNews');
const Opportunity = require('../models/Opportunity');
const Product = require('../models/product');
const Carousel = require('../models/Carousel');
const BoardOfDirector = require('../models/BoardOfDirector');
const Management = require('../models/Management');
const HeaderUpdate = require('../models/HeaderUpdate');
const InvestorCategory = require('../models/InvestorCategory');
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');
const ForeignExchange = require('../models/ForeignExchange');
const Wakala = require('../models/Wakala');
const FAQ = require('../models/FAQ');
const User = require('../models/user');

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
      totalNewsAndUpdates, monthlyNewsAndUpdates, newsAndUpdatesTrends,
      totalInvestorNews, monthlyInvestorNews, investorNewsTrends,
      totalOpportunities, monthlyOpportunities, opportunityTrends,
      totalProducts, monthlyProducts, productTrends,
      totalCarousels, monthlyCarousels, carouselTrends,
      totalBoardMembers, monthlyBoardMembers, boardMemberTrends,
      totalManagement, monthlyManagement, managementTrends,
      totalHeaderUpdates, monthlyHeaderUpdates, headerUpdateTrends,
      totalInvestorCategories, monthlyInvestorCategories, investorCategoryTrends,
      totalMenuCategories, monthlyMenuCategories, menuCategoryTrends,
      totalMenuItems, monthlyMenuItems, menuItemTrends,
      totalForeignExchange, monthlyForeignExchange, foreignExchangeTrends,
      totalWakalas, monthlyWakalas, wakalaTrends,
      totalFAQs, monthlyFAQs, faqTrends,
      totalUsers, monthlyUsers, userTrends
    ] = await Promise.all([
      // News and Updates
      NewsAndUpdate.countDocuments(),
      NewsAndUpdate.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      getMonthlyAggregation(NewsAndUpdate),

      // Investor News
      InvestorNews.countDocuments(),
      InvestorNews.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      getMonthlyAggregation(InvestorNews),

      // Opportunities
      Opportunity.countDocuments(),
      Opportunity.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      getMonthlyAggregation(Opportunity),

      // Products
      Product.countDocuments(),
      Product.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      getMonthlyAggregation(Product),

      // Carousel
      Carousel.countDocuments(),
      Carousel.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      getMonthlyAggregation(Carousel),

      // Board of Directors
      BoardOfDirector.countDocuments(),
      BoardOfDirector.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      getMonthlyAggregation(BoardOfDirector),

      // Management
      Management.countDocuments(),
      Management.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      getMonthlyAggregation(Management),

      // Header Updates
      HeaderUpdate.countDocuments(),
      HeaderUpdate.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      getMonthlyAggregation(HeaderUpdate),

      // Investor Categories
      InvestorCategory.countDocuments(),
      InvestorCategory.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      getMonthlyAggregation(InvestorCategory),

      // Menu Categories
      MenuCategory.countDocuments(),
      MenuCategory.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      getMonthlyAggregation(MenuCategory),

      // Menu Items
      MenuItem.countDocuments(),
      MenuItem.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      getMonthlyAggregation(MenuItem),

      // Foreign Exchange
      ForeignExchange.countDocuments(),
      ForeignExchange.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      getMonthlyAggregation(ForeignExchange),

      // Wakala
      Wakala.countDocuments(),
      Wakala.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      getMonthlyAggregation(Wakala),

      // FAQs
      FAQ.countDocuments(),
      FAQ.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      getMonthlyAggregation(FAQ),

      // Users
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      getMonthlyAggregation(User),
    ]);

    const formatTrends = (data) =>
      data.map(({ _id, count }) => ({
        month: `${_id.year}-${String(_id.month).padStart(2, '0')}`,
        count,
      }));

    res.status(200).json({
      newsAndUpdates: { 
        total: totalNewsAndUpdates, 
        thisMonth: monthlyNewsAndUpdates, 
        trends: formatTrends(newsAndUpdatesTrends) 
      },
      investorNews: { 
        total: totalInvestorNews, 
        thisMonth: monthlyInvestorNews, 
        trends: formatTrends(investorNewsTrends) 
      },
      opportunities: { 
        total: totalOpportunities, 
        thisMonth: monthlyOpportunities, 
        trends: formatTrends(opportunityTrends) 
      },
      products: { 
        total: totalProducts, 
        thisMonth: monthlyProducts, 
        trends: formatTrends(productTrends) 
      },
      carousels: { 
        total: totalCarousels, 
        thisMonth: monthlyCarousels, 
        trends: formatTrends(carouselTrends) 
      },
      boardMembers: { 
        total: totalBoardMembers, 
        thisMonth: monthlyBoardMembers, 
        trends: formatTrends(boardMemberTrends) 
      },
      management: { 
        total: totalManagement, 
        thisMonth: monthlyManagement, 
        trends: formatTrends(managementTrends) 
      },
      headerUpdates: { 
        total: totalHeaderUpdates, 
        thisMonth: monthlyHeaderUpdates, 
        trends: formatTrends(headerUpdateTrends) 
      },
      investorCategories: { 
        total: totalInvestorCategories, 
        thisMonth: monthlyInvestorCategories, 
        trends: formatTrends(investorCategoryTrends) 
      },
      menuCategories: { 
        total: totalMenuCategories, 
        thisMonth: monthlyMenuCategories, 
        trends: formatTrends(menuCategoryTrends) 
      },
      menuItems: { 
        total: totalMenuItems, 
        thisMonth: monthlyMenuItems, 
        trends: formatTrends(menuItemTrends) 
      },
      foreignExchange: { 
        total: totalForeignExchange, 
        thisMonth: monthlyForeignExchange, 
        trends: formatTrends(foreignExchangeTrends) 
      },
      wakalas: { 
        total: totalWakalas, 
        thisMonth: monthlyWakalas, 
        trends: formatTrends(wakalaTrends) 
      },
      faqs: { 
        total: totalFAQs, 
        thisMonth: monthlyFAQs, 
        trends: formatTrends(faqTrends) 
      },
      users: { 
        total: totalUsers, 
        thisMonth: monthlyUsers, 
        trends: formatTrends(userTrends) 
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch dashboard summary' });
  }
});

module.exports = router;
