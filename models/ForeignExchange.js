const mongoose = require('mongoose');

const ForeignExchangeSchema = new mongoose.Schema({
  currency: {
    type: String,
    required: true,
    uppercase: true,
    unique: true,
  },
  currencyName: {
    type: String,
    required: true,
  },
  flag: {
    type: String, // Emoji or flag code
  },
  buyRate: {
    type: Number,
    required: true,
  },
  sellRate: {
    type: Number,
    required: true,
  },
  baseCurrency: {
    type: String,
    default: 'TZS',
    uppercase: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ForeignExchange', ForeignExchangeSchema);

