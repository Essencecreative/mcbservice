const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the User schema with additional fields for team member
const teamSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  jobTitle: {
    type: String,
    required: true,
  },
  team: {
    type: String,
    enum: ['Management Team', 'Expert'],
    required: true,
  },
  biography: {
    type: String,
  },
  photo: {
    type: String,  // URL of the uploaded photo
  },
});

const Team = mongoose.model('Team', teamSchema);
module.exports = Team;
