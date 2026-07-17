require('dotenv').config();
const mongoose = require('mongoose');
const BrandSection = require('./models/BrandSection');

const checkDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const data = await BrandSection.findOne();
  console.log("Data in DB:", JSON.stringify(data, null, 2));
  process.exit(0);
};

checkDB();
