const cron = require('node-cron');
const { syncRatesFromAPI } = require('../routes/foreignExchange');

/**
 * Cron job to sync foreign exchange rates daily at 7:00 AM
 * Cron expression: '0 7 * * *' means:
 * - 0: minute (0th minute)
 * - 7: hour (7 AM)
 * - *: day of month (every day)
 * - *: month (every month)
 * - *: day of week (every day of week)
 */
function startForeignExchangeCron() {
  console.log('🔄 Foreign Exchange Cron Job initialized - will run daily at 7:00 AM');
  
  // Schedule the job to run at 7:00 AM every day
  cron.schedule('0 7 * * *', async () => {
    console.log('⏰ [Cron Job] Starting foreign exchange rates sync at', new Date().toISOString());
    
    try {
      const result = await syncRatesFromAPI();
      
      if (result.success) {
        console.log('✅ [Cron Job] Foreign exchange rates synced successfully');
        console.log(`   Updated ${result.updates.length} currency rates`);
        result.updates.forEach(update => {
          console.log(`   - ${update.currency}: ${update.action}`);
        });
      } else {
        console.error('❌ [Cron Job] Failed to sync foreign exchange rates:', result.error);
      }
    } catch (error) {
      console.error('❌ [Cron Job] Error during foreign exchange sync:', error.message);
    }
  }, {
    scheduled: true,
    timezone: "Africa/Dar_es_Salaam" // Tanzania timezone
  });
}

module.exports = { startForeignExchangeCron };

