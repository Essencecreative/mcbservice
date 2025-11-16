const express = require('express');
const https = require('https');
const router = express.Router();
const ForeignExchange = require('../models/ForeignExchange');
const authenticateToken = require('../middlewares/authMiddleware');

// Helper function to sync rates from external API
async function syncRatesFromAPI() {
  try {
    const url = 'https://api.exchangerate-api.com/v4/latest/TZS';
    
    const data = await new Promise((resolve, reject) => {
      https.get(url, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          if (response.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(new Error('Failed to parse response'));
            }
          } else {
            reject(new Error(`API returned status ${response.statusCode}`));
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
    
    // Currency mapping with flags and names
    const currencyMap = {
      'USD': { name: 'US Dollar', flag: '🇺🇸' },
      'EUR': { name: 'Euro', flag: '🇪🇺' },
      'GBP': { name: 'British Pound', flag: '🇬🇧' },
      'KES': { name: 'Kenyan Shilling', flag: '🇰🇪' },
      'INR': { name: 'Indian Rupee', flag: '🇮🇳' },
      'AUD': { name: 'Australian Dollar', flag: '🇦🇺' },
      'CAD': { name: 'Canadian Dollar', flag: '🇨🇦' },
      'CHF': { name: 'Swiss Franc', flag: '🇨🇭' },
      'JPY': { name: 'Japanese Yen', flag: '🇯🇵' },
      'CNY': { name: 'Chinese Yuan', flag: '🇨🇳' },
      'ZAR': { name: 'South African Rand', flag: '🇿🇦' },
      'SAR': { name: 'Saudi Riyal', flag: '🇸🇦' },
    };
    
    const rates = data.rates;
    const updates = [];
    
    for (const [currency, info] of Object.entries(currencyMap)) {
      if (rates[currency]) {
        // API returns: 1 TZS = X currency (e.g., 1 TZS = 0.0004 USD)
        // We need: 1 currency = X TZS (e.g., 1 USD = 2500 TZS)
        // So we invert: 1 / rate
        const rateToTZS = 1 / rates[currency];
        // Add small spread for buy/sell (bank buys at lower, sells at higher)
        const spread = 0.02; // 2% spread
        const buyRate = rateToTZS * (1 - spread / 2); // Bank buys foreign currency at lower rate
        const sellRate = rateToTZS * (1 + spread / 2); // Bank sells foreign currency at higher rate
        
        const existing = await ForeignExchange.findOne({ currency });
        
        if (existing) {
          existing.buyRate = buyRate;
          existing.sellRate = sellRate;
          existing.lastUpdated = new Date();
          await existing.save();
          updates.push({ currency, action: 'updated' });
        } else {
          const newRate = new ForeignExchange({
            currency,
            currencyName: info.name,
            flag: info.flag,
            buyRate,
            sellRate,
            baseCurrency: 'TZS',
            isActive: true,
          });
          await newRate.save();
          updates.push({ currency, action: 'created' });
        }
      }
    }
    
    return { success: true, updates };
  } catch (error) {
    console.error('Error syncing rates from API:', error);
    return { success: false, error: error.message };
  }
}

// GET /foreign-exchange - Get all active foreign exchange rates
router.get('/', async (req, res) => {
  try {
    let rates = await ForeignExchange.find({ isActive: true })
      .sort({ currency: 1 });
    
    // If no rates exist, automatically sync from external API
    if (rates.length === 0) {
      console.log('No foreign exchange rates found. Syncing from external API...');
      const syncResult = await syncRatesFromAPI();
      if (syncResult.success) {
        // Fetch rates again after sync
        rates = await ForeignExchange.find({ isActive: true })
          .sort({ currency: 1 });
        console.log(`Successfully synced ${rates.length} exchange rates`);
      } else {
        console.error('Failed to sync rates:', syncResult.error);
      }
    }
    
    res.json({ rates });
  } catch (error) {
    console.error('Error fetching foreign exchange rates:', error);
    res.status(500).json({ message: 'Failed to fetch foreign exchange rates' });
  }
});

// GET /foreign-exchange/all - Get all rates (including inactive) - requires auth
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const rates = await ForeignExchange.find()
      .sort({ currency: 1 });
    
    res.json({ rates });
  } catch (error) {
    console.error('Error fetching foreign exchange rates:', error);
    res.status(500).json({ message: 'Failed to fetch foreign exchange rates' });
  }
});

// GET /foreign-exchange/:id - Get single rate
router.get('/:id', async (req, res) => {
  try {
    const rate = await ForeignExchange.findById(req.params.id);
    
    if (!rate) {
      return res.status(404).json({ message: 'Foreign exchange rate not found' });
    }
    
    res.json({ rate });
  } catch (error) {
    console.error('Error fetching foreign exchange rate:', error);
    res.status(500).json({ message: 'Failed to fetch foreign exchange rate' });
  }
});

// POST /foreign-exchange - Create new rate (requires auth)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { currency, currencyName, flag, buyRate, sellRate, baseCurrency, isActive } = req.body;
    
    const newRate = new ForeignExchange({
      currency: currency.toUpperCase(),
      currencyName,
      flag,
      buyRate,
      sellRate,
      baseCurrency: baseCurrency?.toUpperCase() || 'TZS',
      isActive: isActive !== undefined ? isActive : true,
    });
    
    await newRate.save();
    
    res.status(201).json({ 
      message: 'Foreign exchange rate created successfully',
      rate: newRate 
    });
  } catch (error) {
    console.error('Error creating foreign exchange rate:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Currency already exists' });
    }
    res.status(500).json({ message: 'Failed to create foreign exchange rate' });
  }
});

// PUT /foreign-exchange/:id - Update rate (requires auth)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { currency, currencyName, flag, buyRate, sellRate, baseCurrency, isActive } = req.body;
    
    const updateData = {};
    if (currency) updateData.currency = currency.toUpperCase();
    if (currencyName) updateData.currencyName = currencyName;
    if (flag !== undefined) updateData.flag = flag;
    if (buyRate !== undefined) updateData.buyRate = buyRate;
    if (sellRate !== undefined) updateData.sellRate = sellRate;
    if (baseCurrency) updateData.baseCurrency = baseCurrency.toUpperCase();
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.lastUpdated = new Date();
    
    const updatedRate = await ForeignExchange.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedRate) {
      return res.status(404).json({ message: 'Foreign exchange rate not found' });
    }
    
    res.json({ 
      message: 'Foreign exchange rate updated successfully',
      rate: updatedRate 
    });
  } catch (error) {
    console.error('Error updating foreign exchange rate:', error);
    res.status(500).json({ message: 'Failed to update foreign exchange rate' });
  }
});

// DELETE /foreign-exchange/:id - Delete rate (requires auth)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deletedRate = await ForeignExchange.findByIdAndDelete(req.params.id);
    
    if (!deletedRate) {
      return res.status(404).json({ message: 'Foreign exchange rate not found' });
    }
    
    res.json({ message: 'Foreign exchange rate deleted successfully' });
  } catch (error) {
    console.error('Error deleting foreign exchange rate:', error);
    res.status(500).json({ message: 'Failed to delete foreign exchange rate' });
  }
});

// POST /foreign-exchange/sync - Sync rates from external API (requires auth)
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const syncResult = await syncRatesFromAPI();
    
    if (syncResult.success) {
      res.json({ 
        message: 'Foreign exchange rates synced successfully',
        updates: syncResult.updates 
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to sync foreign exchange rates',
        error: syncResult.error 
      });
    }
  } catch (error) {
    console.error('Error syncing foreign exchange rates:', error);
    res.status(500).json({ message: 'Failed to sync foreign exchange rates' });
  }
});

module.exports = router;

