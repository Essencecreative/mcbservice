// scripts/testCronJob.js
// Test script to manually run the foreign exchange sync function
require('dotenv').config();
const mongoose = require('mongoose');
const { syncRatesFromAPI } = require('../routes/foreignExchange');

// Connect to MongoDB
if (!process.env.MONGODB_URI) {
  console.error('❌ MongoDB connection error: MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully\n');
    console.log('🔄 Starting foreign exchange rates sync test...\n');
    console.log('⏰ Test started at:', new Date().toISOString());
    console.log('─'.repeat(60));
    
    try {
      const result = await syncRatesFromAPI();
      
      if (result.success) {
        console.log('\n✅ Foreign exchange rates synced successfully!');
        console.log(`   Updated ${result.updates.length} currency rates\n`);
        
        result.updates.forEach(update => {
          console.log(`   ✓ ${update.currency}: ${update.action}`);
        });
        
        console.log('\n' + '─'.repeat(60));
        console.log('✅ Test completed successfully!');
        console.log('⏰ Test finished at:', new Date().toISOString());
      } else {
        console.error('\n❌ Failed to sync foreign exchange rates');
        console.error(`   Error: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      console.error('\n❌ Error during foreign exchange sync test:');
      console.error(`   ${error.message}`);
      console.error(error.stack);
      process.exit(1);
    } finally {
      await mongoose.connection.close();
      console.log('\n📦 MongoDB connection closed');
      process.exit(0);
    }
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

