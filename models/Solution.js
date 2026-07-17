const mongoose = require('mongoose');

const SolutionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  buttonText: {
    type: String,
    default: "View information",
  },
  buttonLink: {
    type: String,
    default: "what-we-offers.html",
  },
  order: {
    type: Number,
    default: 0,
  }
});

module.exports = mongoose.model('Solution', SolutionSchema);
