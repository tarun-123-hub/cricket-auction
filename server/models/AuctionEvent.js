const mongoose = require('mongoose');

const auctionEventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
    trim: true
  },
  eventDescription: {
    type: String,
    trim: true
  },
  maxPlayers: {
    type: Number,
    default: 0
  },
  maxBidders: {
    type: Number,
    default: 8,
    min: 2,
    max: 16
  },
  eventPlayers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  registeredBidders: [{
    teamName: {
      type: String,
      required: true,
      trim: true
    },
    ownerName: {
      type: String,
      required: true,
      trim: true
    },
    teamImage: {
      type: String,
      default: null
    },
    purse: {
      type: Number,
      default: 0
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    registeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  isLive: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isComplete: {
    type: Boolean,
    default: false
  },
  currentPlayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null
  },
  currentBid: {
    type: Number,
    default: 0
  },
  timer: {
    type: Number,
    default: 60
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure team names are unique within an event
auctionEventSchema.index({ 'registeredBidders.teamName': 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('AuctionEvent', auctionEventSchema);