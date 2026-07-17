const mongoose = require('mongoose');
const Banner = require('./models/Banner');
require('dotenv').config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // Clear existing
    await Banner.deleteMany({});

    const banners = [
      {
        image: 'https://res.cloudinary.com/dedfrilse/image/upload/v1652356414/Home_Banner-01.jpg',
        description1: 'Delivering creative',
        description2: 'Making your business brand stand out',
        buttonText: 'Get started now',
        buttonLink: '/aboutus',
        order: 1
      },
      {
        image: 'https://res.cloudinary.com/dedfrilse/image/upload/v1652356415/Home_Banner-02.jpg',
        description1: 'Drive your sales',
        description2: 'Reach more customers with our digital strategy',
        buttonText: 'Get started now',
        buttonLink: '/aboutus',
        order: 2
      },
      {
        image: 'https://res.cloudinary.com/dedfrilse/image/upload/v1652356415/Home_Banner-03.jpg',
        description1: 'Manage your social',
        description2: 'We build your online presence',
        buttonText: 'Get started now',
        buttonLink: '/aboutus',
        order: 3
      }
    ];

    await Banner.insertMany(banners);
    console.log('Banners seeded!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
