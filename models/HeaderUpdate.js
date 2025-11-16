const mongoose = require('mongoose');

const HeaderUpdateSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Update text is required'],
    maxlength: [200, 'Update text cannot exceed 200 characters'],
  },
  link: {
    type: String,
    required: false, // Optional link
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Only one active update at a time
HeaderUpdateSchema.index({ isActive: 1 });

const HeaderUpdate = mongoose.model('HeaderUpdate', HeaderUpdateSchema);

module.exports = HeaderUpdate;

