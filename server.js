// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path'); // <-- Add path module

const userRoutes = require('./routes/user');
const opportunityRoutes = require('./routes/opportunities');
const statsRoutes = require('./routes/statistics');
const productsRoutes = require('./routes/products');
const newsAndUpdatesRoutes = require('./routes/newsAndUpdates');
const investorNewsRoutes = require('./routes/investorNews');
const investorCategoriesRoutes = require('./routes/investorCategories');
const carouselRoutes = require('./routes/carousel');
const boardOfDirectorsRoutes = require('./routes/boardOfDirectors');
const managementRoutes = require('./routes/management');
const headerUpdateRoutes = require('./routes/headerUpdate');
const menuCategoriesRoutes = require('./routes/menuCategories');
const menuItemsRoutes = require('./routes/menuItems');
const foreignExchangeRoutes = require('./routes/foreignExchange');
const wakalaRoutes = require('./routes/wakala');
const faqsRoutes = require('./routes/faqs');
const contactRoutes = require('./routes/contact');
const applicationRoutes = require('./routes/application');
const User = require('./models/user');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json({ limit: '10mb' })); // Increase if large images
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// === SERVE UPLOADED FILES LOCALLY ===
const uploadDirs = {
  products: path.join(__dirname, 'uploads', 'products'),
  'news-and-updates': path.join(__dirname, 'uploads', 'news-and-updates'),
  'investor-news': path.join(__dirname, 'uploads', 'investor-news'),
  'investor-categories': path.join(__dirname, 'uploads', 'investor-categories'),
  'carousel': path.join(__dirname, 'uploads', 'carousel'),
  'board-of-directors': path.join(__dirname, 'uploads', 'board-of-directors'),
  'management': path.join(__dirname, 'uploads', 'management'),
  'menu-items': path.join(__dirname, 'uploads', 'menu-items'),
  // Add more folders as needed
};

// Create upload directories if they don't exist
Object.values(uploadDirs).forEach(dir => {
  require('fs').mkdirSync(dir, { recursive: true });
});

// Serve static files from upload directories
app.use('/uploads/products', express.static(uploadDirs.products));
app.use('/uploads/news-and-updates', express.static(uploadDirs['news-and-updates']));
app.use('/uploads/investor-news', express.static(uploadDirs['investor-news']));
app.use('/uploads/investor-categories', express.static(uploadDirs['investor-categories']));
app.use('/uploads/carousel', express.static(uploadDirs['carousel']));
app.use('/uploads/board-of-directors', express.static(uploadDirs['board-of-directors']));
app.use('/uploads/management', express.static(uploadDirs['management']));
app.use('/uploads/menu-items', express.static(uploadDirs['menu-items']));

// Optional: Serve a generic /uploads route (not recommended for production)
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/opportunities', opportunityRoutes);
app.use('/users', userRoutes);
app.use('/stats', statsRoutes);
app.use('/products', productsRoutes);
app.use('/news-and-updates', newsAndUpdatesRoutes);
app.use('/investor-news', investorNewsRoutes);
app.use('/investor-categories', investorCategoriesRoutes);
app.use('/carousel', carouselRoutes);
app.use('/board-of-directors', boardOfDirectorsRoutes);
app.use('/management', managementRoutes);
app.use('/header-update', headerUpdateRoutes);
app.use('/menu-categories', menuCategoriesRoutes);
app.use('/menu-items', menuItemsRoutes);
app.use('/foreign-exchange', foreignExchangeRoutes);
app.use('/wakala', wakalaRoutes);
app.use('/faqs', faqsRoutes);
app.use('/contact', contactRoutes);
app.use('/application', applicationRoutes);

// === 404 Handler for unmatched routes ===
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// === Global Error Handler ===
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Connect to MongoDB
if (!process.env.MONGODB_URI) {
  console.error('MongoDB connection error: MONGODB_URI is not defined in environment variables');
  console.error('Please create a .env file with: MONGODB_URI=your_mongodb_connection_string');
  process.exit(1);
}

// MongoDB connection options
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
};

mongoose
  .connect(process.env.MONGODB_URI, mongooseOptions)
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully');
    await checkAndCreateAdminUser();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('\n📋 Troubleshooting tips:');
    console.error('1. Verify MONGODB_URI in your .env file is correct');
    console.error('2. Check if your MongoDB Atlas cluster is running (not paused)');
    console.error('3. Whitelist your IP address in MongoDB Atlas Network Access');
    console.error('   - Go to MongoDB Atlas → Network Access → Add IP Address');
    console.error('   - Or use 0.0.0.0/0 to allow all IPs (for development only)');
    console.error('4. Verify connection string format:');
    console.error('   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority');
    console.error('5. Check your internet connection and DNS resolution');
    console.error('\n⚠️  Server will continue running, but database operations will fail.');
    console.error('   Fix the MongoDB connection to enable full functionality.\n');
    // Don't exit - allow server to run for testing API routes without DB
  });

// Function to ensure admin user exists
async function checkAndCreateAdminUser() {
  const adminUsername = 'admin';
  const adminPassword = 'password'; // Change in production!

  try {
    const existingAdmin = await User.findOne({ username: adminUsername });
    if (!existingAdmin) {
      const newAdmin = new User({
        username: adminUsername,
        password: adminPassword,
        role: 'admin',
      });
      await newAdmin.save();
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
    }
  } catch (err) {
    console.error('Error ensuring admin user:', err.message);
  }
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});