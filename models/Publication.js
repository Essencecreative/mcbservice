const mongoose = require('mongoose');

// Define the Publication Schema
const PublicationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  contentDescription: {
    type: String,
    required: [true, 'Content description is required'],
  },
  publicationDate: {
    type: Date,
    required: false, // It's optional in this case, as per your code
  },
  photo: { type: String },
  documentUrl: { type: String }
}, {
  timestamps: true, // Automatically add createdAt and updatedAt fields
});

// Create the Publication model
const Publication = mongoose.model('Publication', PublicationSchema);

module.exports = Publication;
