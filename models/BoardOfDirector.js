const mongoose = require('mongoose');

const BoardOfDirectorSchema = new mongoose.Schema({
  position: {
    type: Number,
    required: [true, 'Position is required'],
    default: 0,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
  },
  linkedinLink: {
    type: String,
  },
  photo: {
    type: String, // Cloudinary URL or local path
  },
}, {
  timestamps: true,
});

// Index for sorting by position
BoardOfDirectorSchema.index({ position: 1 });

const BoardOfDirector = mongoose.model('BoardOfDirector', BoardOfDirectorSchema);

module.exports = BoardOfDirector;

