const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String }, // optional fallback
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  
  // New Essence specific fields
  bannerPhoto: { type: String },
  miniPhoto: { type: String },
  clientName: { type: String },
  services: { type: String },
  industry: { type: String },
  projectBrief: { type: String },
  solutionBrief: { type: String },
  projectLink: { type: String },
  gallery: [{ type: String }],
  quotePhoto: { type: String },
  quoteDescription: { type: String },
  quoteTitle: { type: String },
  
  imageUrls: [{ type: String }], // legacy fallback
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Project', projectSchema);
