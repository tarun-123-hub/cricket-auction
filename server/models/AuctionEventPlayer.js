const mongoose = require('mongoose');

const auctionEventPlayerSchema = new mongoose.Schema({
  auctionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionEvent',
    required: true
  },
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  auctionPrice: {
    type: Number,
    required: true,
    min: 0
  },
  orderIndex: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'sold', 'unsold'],
    default: 'pending'
  },
  finalPrice: {
    type: Number,
    default: null
  },
  soldTo: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Compound index to ensure unique player per event
auctionEventPlayerSchema.index({ auctionId: 1, playerId: 1 }, { unique: true });

module.exports = mongoose.model('AuctionEventPlayer', auctionEventPlayerSchema);