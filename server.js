// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path'); // <-- Add path module

const userRoutes = require('./routes/user');
const clientsRoutes = require('./routes/clients');
const projectsRoutes = require('./routes/projects');
const categoriesRoutes = require('./routes/categories');
const testimonialsRoutes = require('./routes/testimonials');
const teamMembersRoutes = require('./routes/teamMembers');
const statsRoutes = require('./routes/stats');
const bannerRoutes = require('./routes/banners');
const User = require('./models/user');
const requestLogger = require('./middlewares/requestLogger');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json({ limit: '10mb' })); // Increase if large images
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Request Logger - Log all incoming requests
app.use(requestLogger);

// Trust proxy - Important for getting correct protocol/host behind reverse proxy
// This allows req.protocol and req.get('host') to work correctly with nginx/load balancers
app.set('trust proxy', true);

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
  'banners': path.join(__dirname, 'uploads', 'banners'),
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
app.use('/uploads/banners', express.static(uploadDirs['banners']));
app.use('/uploads/menu-categories', express.static(path.join(__dirname, 'uploads', 'menu-categories')));

// Optional: Serve a generic /uploads route (not recommended for production)
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/team', teamMembersRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/banners', bannerRoutes);

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
  serverSelectionTimeoutMS: 2000, // Short timeout for fallback
  socketTimeoutMS: 45000,
};

mongoose
  .connect(process.env.MONGODB_URI, mongooseOptions)
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully');
    await checkAndCreateAdminUser();
  })
  .catch(async (err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️ Falling back to In-Memory MongoDB for testing...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log('✅ Connected to In-Memory MongoDB successfully');
      await checkAndCreateAdminUser();
    } catch (memErr) {
      console.error('❌ Failed to start In-Memory MongoDB:', memErr.message);
    }
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