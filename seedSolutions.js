require('dotenv').config();
const mongoose = require('mongoose');
const Solution = require('./models/Solution');

const seedSolutions = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const count = await Solution.countDocuments();
    if (count === 0) {
      console.log('No solutions found. Seeding default solutions...');
      const defaultSolutions = [
        {
          title: "Revamp Your Social Media With Us",
          image: "https://res.cloudinary.com/dedfrilse/image/upload/v1652356407/Solution-01.jpg",
          buttonText: "View information",
          buttonLink: "what-we-offers.html",
          order: 1
        },
        {
          title: "Build Your Brand Presence With Us",
          image: "https://res.cloudinary.com/dedfrilse/image/upload/v1652356398/Solution-02.jpg",
          buttonText: "View information",
          buttonLink: "what-we-offers.html",
          order: 2
        },
        {
          title: "Win More Sale Leads With Our Social Media Strategy",
          image: "https://res.cloudinary.com/dedfrilse/image/upload/v1652356392/Solution-03.jpg",
          buttonText: "View information",
          buttonLink: "what-we-offers.html",
          order: 3
        },
        {
          title: "Reach More Customers With Our Digital Marketing Strategy",
          image: "https://res.cloudinary.com/dedfrilse/image/upload/v1652356390/Solution-04.jpg",
          buttonText: "View information",
          buttonLink: "what-we-offers.html",
          order: 4
        },
        {
          title: "Expand Your Network With Us",
          image: "https://res.cloudinary.com/dedfrilse/image/upload/v1652356396/Solution-05.jpg",
          buttonText: "View information",
          buttonLink: "what-we-offers.html",
          order: 5
        }
      ];
      await Solution.insertMany(defaultSolutions);
      console.log('Solutions seeded successfully!');
    } else {
      console.log('Solutions already exist. No seeding needed.');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding Solutions:', error);
    mongoose.connection.close();
  }
};

seedSolutions();
