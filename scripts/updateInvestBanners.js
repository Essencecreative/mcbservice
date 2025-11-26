// scripts/updateInvestBanners.js
// Migration script to update Invest menu items with proper banner images
require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/forlandservice')
  .then(() => {
    console.log('Connected to MongoDB');
    updateInvestBanners();
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

async function updateInvestBanners() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔄 [INVEST BANNER UPDATE] Starting migration to update Invest menu item banners');
    console.log('─'.repeat(80));

    // Find all Invest menu items
    const investItems = await MenuItem.find({ 
      menuCategory: 'invest',
      route: '/Invest'
    });

    console.log(`📊 [INVEST BANNER UPDATE] Found ${investItems.length} Invest menu items to update`);

    if (investItems.length === 0) {
      console.log('ℹ️  [INVEST BANNER UPDATE] No Invest menu items found. Nothing to update.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // List of Invest items that should have Invest-Banner.png
    const investItemNames = [
      'Instant Income/Upfront',
      'Semi Fixed/Flexible',
      'Regular Interest Payment',
      'Call Account',
      'Traditional (US$/E/EUR)',
      'Right issue'
    ];

    let updatedCount = 0;
    let skippedCount = 0;

    for (const item of investItems) {
      const shouldUpdate = investItemNames.includes(item.name);
      const currentBanner = item.pageContent?.bannerImage || '';
      const newBanner = '/assets/images/backgrounds/Invest-Banner.png';

      if (shouldUpdate && currentBanner !== newBanner) {
        // Update the banner image
        if (!item.pageContent) {
          item.pageContent = {};
        }
        item.pageContent.bannerImage = newBanner;
        await item.save();
        
        console.log(`✅ [INVEST BANNER UPDATE] Updated "${item.name}" banner: ${currentBanner || '(empty)'} → ${newBanner}`);
        updatedCount++;
      } else if (shouldUpdate && currentBanner === newBanner) {
        console.log(`ℹ️  [INVEST BANNER UPDATE] Skipped "${item.name}" - already has correct banner`);
        skippedCount++;
      } else {
        console.log(`⚠️  [INVEST BANNER UPDATE] Skipped "${item.name}" - not in update list`);
        skippedCount++;
      }
    }

    console.log('─'.repeat(80));
    console.log('📊 [INVEST BANNER UPDATE] Migration Summary:');
    console.log(`   ✅ Updated: ${updatedCount} items`);
    console.log(`   ⏭️  Skipped: ${skippedCount} items`);
    console.log(`   📝 Total: ${investItems.length} items`);
    console.log('='.repeat(80) + '\n');

    await mongoose.connection.close();
    console.log('✅ [INVEST BANNER UPDATE] Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ [INVEST BANNER UPDATE] Error during migration:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

