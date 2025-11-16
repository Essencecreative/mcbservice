const mongoose = require('mongoose');

const InvestorCategorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['agm', 'financial-reports', 'tariff-guide', 'shareholding', 'share-price', 'contact'],
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

