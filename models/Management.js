const mongoose = require('mongoose');

const ManagementSchema = new mongoose.Schema({
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
ManagementSchema.index({ position: 1 });

const Management = mongoose.model('Management', ManagementSchema);

module.exports = Management;

