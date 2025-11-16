const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  menuCategory: {
    type: String,
    required: true,
    enum: ['personal', 'invest', 'business', 'bancassurance'],
  },
  subcategory: {
    type: String,
    required: true, // e.g., "Transactional Account", "Saving Account"
  },
  route: {
    type: String,
    required: true, // e.g., "/Transactional-Account", "/Saving-Account"
  },
  name: {
    type: String,
    required: true, // e.g., "Personal Current", "Mwalimu Personal Loan"
  },
  position: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Page Content
  pageContent: {
    bannerImage: {
      type: String, // URL or path to banner image
    },
    breadcrumbTitle: {
      type: String,
      required: true,
    },
    breadcrumbSubTitle: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    features: [{
      text: {
        type: String,
        required: true,
      },
    }],
    benefits: [{
      text: {
        type: String,
        required: true,
      },
    }],
    accordionItems: [{
      title: {
        type: String,
        required: true,
      },
      content: {
        type: String,
        required: true, // Can be HTML/rich text
      },
      position: {
        type: Number,
        required: true,
      },
    }],
    additionalContent: {
      type: String, // HTML/rich text for any additional content
    },
  },
}, {
  timestamps: true,
});

MenuItemSchema.index({ menuCategory: 1, subcategory: 1, position: 1 });
MenuItemSchema.index({ route: 1, name: 1 });

module.exports = mongoose.model('MenuItem', MenuItemSchema);

