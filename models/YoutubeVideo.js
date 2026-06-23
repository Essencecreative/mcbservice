const mongoose = require('mongoose');

const YoutubeVideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 500,
  },
  description: {
    type: String,
  },
  youtubeId: {
    type: String,
    required: true,
    maxlength: 100,
  },
  category: {
    type: String,
    maxlength: 100,
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

YoutubeVideoSchema.index({ position: 1 });

module.exports = mongoose.model('YoutubeVideo', YoutubeVideoSchema);
