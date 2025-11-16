const mongoose = require('mongoose');

const NewsAndUpdateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: [80, 'Title cannot exceed 80 characters'],
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    maxlength: [200, 'Short description cannot exceed 200 characters'],
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
  },
  image: {
    type: String,
    required: [true, 'Image is required'],
  },
}, {
  timestamps: true, // Automatically add createdAt and updatedAt fields
});

const NewsAndUpdate = mongoose.model('NewsAndUpdate', NewsAndUpdateSchema);

module.exports = NewsAndUpdate;

