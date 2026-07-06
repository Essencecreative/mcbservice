const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  authorName: { type: String, required: true },
  quote: { type: String, required: true },
  company: { type: String, required: false },
  avatarUrl: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
