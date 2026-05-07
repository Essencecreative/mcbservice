const mongoose = require('mongoose');

const InvestorCategorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['agm', 'financial-reports', 'reports', 'tariff-guide', 'shareholding', 'share-price', 'contact', 'rights-issue'],
  },
  type: {
    type: String,
    enum: ['Financial Report', 'Annual Report', 'Market Disclosure'],
    required: false,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  pdfUrl: {
    type: String,
    required: false,
  },
}, {
  timestamps: true, // Automatically add createdAt and updatedAt fields
});

const InvestorCategory = mongoose.model('InvestorCategory', InvestorCategorySchema);

module.exports = InvestorCategory;

