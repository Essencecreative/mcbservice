const mongoose = require('mongoose');
require('dotenv').config();
const InvestorCategory = require('../models/InvestorCategory');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const categories = await InvestorCategory.distinct('category');
    console.log('Categories found:', categories);
    
    const sample = await InvestorCategory.findOne();
    console.log('Sample document:', sample);

    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err);
    process.exit(1);
  }
}

check();
