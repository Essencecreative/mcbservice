const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  description1: {
    type: String,
    default: '',
  },
  description2: {
    type: String,
    default: '',
  },
  buttonText: {
    type: String,
    default: 'Get started now',
  },
  buttonLink: {
    type: String,
    default: '/aboutus',
  },
  order: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Banner', bannerSchema);
