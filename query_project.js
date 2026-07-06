require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./models/Project');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const p = await Project.findById('6a4b72931891c68480ec56a6');
  console.log('Project found:', p);
  
  const all = await Project.find().select('_id title');
  console.log('All projects:', all);
  
  process.exit(0);
}).catch(console.error);
