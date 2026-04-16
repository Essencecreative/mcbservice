const mongoose = require('mongoose');
require('dotenv').config();
const InvestorCategory = require('../models/InvestorCategory');

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const item = await InvestorCategory.findOne({ category: 'agm' });
    console.log('Item found:', item);
    if (item) {
        console.log('Title:', item.title);
        console.log('Title type:', typeof item.title);
        console.log('Match test:', /annual report/i.test(item.title));
    }
    process.exit(0);
  } catch (err) {
    console.error('Debug failed:', err);
    process.exit(1);
  }
}

debug();
