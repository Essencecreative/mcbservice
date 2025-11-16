const mongoose = require('mongoose');

const WakalaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 200,
  },
  region: {
    type: String,
    required: true,
    maxlength: 100,
  },
  district: {
    type: String,
    required: true,
    maxlength: 100,
  },
  address: {
    type: String,
    required: true,
    maxlength: 500,
  },
  phone: {
    type: String,
    required: true,
    maxlength: 20,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Wakala', WakalaSchema);

