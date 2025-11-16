const mongoose = require('mongoose');

const FAQSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    maxlength: 500,
  },
  answer: {
    type: String,
    required: true,
  },
  position: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

FAQSchema.index({ position: 1 });

module.exports = mongoose.model('FAQ', FAQSchema);

