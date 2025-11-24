const mongoose = require('mongoose');

const MenuCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['personal', 'invest', 'business', 'bancassurance'],
  },
  displayName: {
    type: String,
    required: true,
  },
  position: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  subcategories: [{
    name: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    position: {
      type: Number,
      required: true,
    },
    route: {
      type: String,
      required: true, // e.g., "/Transactional-Account", "/Saving-Account"
    },
    bannerImage: {
      type: String, // URL or path to banner image
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  }],
}, {
  timestamps: true,
});

MenuCategorySchema.index({ position: 1 }, { unique: true });
MenuCategorySchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('MenuCategory', MenuCategorySchema);

