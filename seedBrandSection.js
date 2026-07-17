require('dotenv').config();
const mongoose = require('mongoose');
const BrandSection = require('./models/BrandSection');

const seedBrandSection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let section = await BrandSection.findOne();
    if (!section) {
      console.log('Brand Section not found. Seeding default data...');
      section = new BrandSection({
        title: "We make your brand stand out!",
        image: "https://res.cloudinary.com/dedfrilse/image/upload/v1652416077/476_652px-01.jpg",
        features: [
          {
            iconClass: "line-icon-Cursor-Click2",
            subtitle: "Creative Marketing",
            description: "Stand out in the market with our digital marketing strategy"
          },
          {
            iconClass: "line-icon-Sand-watch2",
            subtitle: "Contents Creation",
            description: "Get the best contents design for your brand marketing"
          },
          {
            iconClass: "line-icon-Idea-5",
            subtitle: "Branding & Design",
            description: "Let us assist you in your business branding design needs"
          }
        ]
      });
      await section.save();
      console.log('Brand Section seeded successfully!');
    } else {
      console.log('Brand Section already exists in the database. No seeding needed.');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding Brand Section:', error);
    mongoose.connection.close();
  }
};

seedBrandSection();
