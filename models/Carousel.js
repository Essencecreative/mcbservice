const mongoose = require('mongoose');

const CarouselSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: [50, 'Title cannot exceed 50 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [150, 'Description cannot exceed 150 characters'],
  },
  buttonTitle: {
    type: String,
    required: [true, 'Button title is required'],
  },
  link: {
    type: String,
    required: [true, 'Link is required'],
  },
  image: {
    type: String,
    required: [true, 'Image is required'],
  },
}, {
  timestamps: true, // Automatically add createdAt and updatedAt fields
});

const Carousel = mongoose.model('Carousel', CarouselSchema);

module.exports = Carousel;

