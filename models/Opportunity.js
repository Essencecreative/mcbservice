const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ["job", "proposal"],
    required: true,
  },
  documentUrl: { type: String }, // cloudinary file link
  createdAt: { type: Date, default: Date.now },
})

// Create the Publication model
const Opportunity = mongoose.model('Opportunity', opportunitySchema);

module.exports = Opportunity;

