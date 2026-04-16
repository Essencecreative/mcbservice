const mongoose = require('mongoose');
require('dotenv').config();
const InvestorCategory = require('../models/InvestorCategory');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Count before
    const countFR = await InvestorCategory.countDocuments({ category: 'financial-reports' });
    console.log(`Found ${countFR} items with category 'financial-reports'`);

    const countAGM = await InvestorCategory.countDocuments({ 
        category: 'agm',
        title: { $regex: /annual report/i }
    });
    console.log(`Found ${countAGM} items with category 'agm' and title matching 'annual report'`);

    // Migrate 'financial-reports' to 'reports' + 'Financial Report' type
    const result = await InvestorCategory.updateMany(
      { category: 'financial-reports' },
      { 
        $set: { 
          category: 'reports',
          type: 'Financial Report' 
        } 
      }
    );
    console.log(`Updated ${result.modifiedCount} financial reports.`);

    // Migrate AGM
    const agmResult = await InvestorCategory.updateMany(
      { 
        category: 'agm',
        title: { $regex: /annual.*report/i }
      },
      { 
        $set: { 
          category: 'reports',
          type: 'Annual Report' 
        } 
      }
    );
    console.log(`Updated ${agmResult.modifiedCount} AGM items.`);

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
