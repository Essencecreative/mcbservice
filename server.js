// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const publicationRoutes = require('./routes/publications');
const userRoutes = require('./routes/user'); // 👈 import user routes
const teamRoutes = require('./routes/team'); // 👈 import user routes
const newsRoutes = require('./routes/news'); // 👈 import user routes
const opportunityRoutes = require('./routes/opportunities'); // 👈 import user routes
const statsRoutes = require('./routes/statistics'); // 👈 import user routes
const galleryRoutes = require('./routes/gallery'); // 👈 import user routes
const User = require('./models/user'); // 👈 import User model


const app = express();
const port = process.env.PORT || 5000;

// Middleware to parse JSON and handle CORS
app.use(bodyParser.json());
app.use(cors());

// Routes
app.use('/opportunities', opportunityRoutes);
app.use('/publications', publicationRoutes);
app.use('/users', userRoutes);
app.use('/team', teamRoutes);
app.use('/news', newsRoutes);
app.use('/stats', statsRoutes);
app.use('/gallery', galleryRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  await checkAndCreateAdminUser(); // 👈 ensure admin user exists
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Function to ensure admin user exists
async function checkAndCreateAdminUser() {
  const adminUsername = 'admin';
  const adminPassword = 'password';

  try {
    const existingAdmin = await User.findOne({ username: adminUsername });
    if (!existingAdmin) {
      const newAdmin = new User({
        username: adminUsername,
        password: adminPassword,
        role: 'admin',
      });
      await newAdmin.save();
      console.log('✅ Admin user created');
    } else {
      console.log('🔐 Admin user already exists');
    }
  } catch (err) {
    console.error('Error ensuring admin user:', err.message);
  }
}

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
