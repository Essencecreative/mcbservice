const mongoose = require('mongoose');

const MarketingStrategySchema = new mongoose.Schema({
  subtitle: {
    type: String,
    default: "DIGITAL MARKETING STRATEGY"
  },
  title: {
    type: String,
    default: "Thinking Social media management? Think us!"
  },
  description: {
    type: String,
    default: "We provide a combined creative and sophisticated Digital Marketing Strategy in Social media management for corporate needs with the Goal to Maximize Company Sales, Launch New Products or Service Promotion, Seasoned Campaigns and More."
  },
  image: {
    type: String,
    default: "https://res.cloudinary.com/dedfrilse/image/upload/v1652356408/Thinking-Social-Media.jpg"
  }
});

module.exports = mongoose.model('MarketingStrategy', MarketingStrategySchema);
