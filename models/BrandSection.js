const mongoose = require('mongoose');

const FeatureSchema = new mongoose.Schema({
  iconClass: { type: String, required: true },
  subtitle: { type: String, required: true },
  description: { type: String, required: true }
});

const BrandSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: "We make your brand stand out!"
  },
  image: {
    type: String,
    required: true,
    default: "https://res.cloudinary.com/dedfrilse/image/upload/v1652416077/476_652px-01.jpg"
  },
  features: [FeatureSchema]
});

module.exports = mongoose.model('BrandSection', BrandSectionSchema);
