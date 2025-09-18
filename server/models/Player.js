const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 16,
    max: 50
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper', 'Captain'],
    required: true
  },
  battingStyle: {
    type: String,
    enum: ['Right-handed', 'Left-handed'],
    required: true
  },
  bowlingStyle: {
    type: String,
    enum: [
      // Pace and medium
      'Right-arm fast', 'Left-arm fast', 'Right-arm medium', 'Left-arm medium',
      // Spin (generic)
      'Right-arm spin', 'Left-arm spin',
      // Spin (specific)
      'Right-arm off-spin', 'Left-arm orthodox', 'Right-arm leg-spin', 'Left-arm chinaman',
      // No bowling
      'None'
    ],
    default: 'None'
  },
  basePrice: {
    type: Number,
    required: true,
    min: 100000 // Minimum 1 Lakh
  },
  image: {
    type: String,
    default: null
  },
  stats: {
    matches: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
    strikeRate: { type: Number, default: 0 }
  },
  previousTeam: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  auctionStatus: {
    type: String,
    enum: ['pending', 'sold', 'unsold'],
    default: 'pending'
  },
  soldTo: {
    type: String,
    default: null
  },
  finalPrice: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Player', playerSchema);