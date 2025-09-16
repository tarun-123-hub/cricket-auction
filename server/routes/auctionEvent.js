const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const AuctionEvent = require('../models/AuctionEvent');
const Player = require('../models/Player');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all auction events
router.get('/all', authenticate, async (req, res) => {
  try {
    const events = await AuctionEvent.find()
      .populate('eventPlayers', 'name category specialty basePrice image age country role battingStyle bowlingStyle')
      .populate('registeredBidders.userId', 'username email')
      .sort({ createdAt: -1 });
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching all events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Activate specific event (Admin only)
router.patch('/:eventId/activate', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    // Deactivate all other events
    await AuctionEvent.updateMany({ isLive: true }, { isLive: false });
    
    // Activate the selected event
    const event = await AuctionEvent.findByIdAndUpdate(
      req.params.eventId,
      { isLive: true },
      { new: true }
    ).populate('eventPlayers').populate('registeredBidders.userId', 'username email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json({
      message: 'Event activated successfully',
      event
    });
  } catch (error) {
    console.error('Error activating event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Configure multer for team image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/teams/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'team-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = 'uploads/teams';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Get current live auction event
router.get('/live', authenticate, async (req, res) => {
  try {
    const liveEvent = await AuctionEvent.findOne({ isLive: true })
      .populate('eventPlayers')
      .populate('registeredBidders.userId', 'username email');
    
    res.json(liveEvent);
  } catch (error) {
    console.error('Error fetching live event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create auction event (Admin only)
router.post('/', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { eventName, eventDescription, maxPlayers, maxBidders, eventPlayers } = req.body;
    
    // Don't deactivate existing events, allow multiple events to exist
    // Only one can be live at a time, but multiple can exist
    
    // Convert string IDs to ObjectIds if they're not already
    const processedEventPlayers = eventPlayers && eventPlayers.length > 0 
      ? eventPlayers.map(id => mongoose.Types.ObjectId.isValid(id) ? id : null).filter(id => id !== null)
      : [];
    
    const event = new AuctionEvent({
      eventName,
      eventDescription,
      maxPlayers: parseInt(maxPlayers) || 0,
      maxBidders: parseInt(maxBidders) || 8,
      eventPlayers: processedEventPlayers,
      createdBy: req.user.id,
      isLive: false // Don't automatically make it live
    });
    
    await event.save();
    await event.populate('eventPlayers', 'name category specialty basePrice image age country role battingStyle bowlingStyle');
    
    res.status(201).json({
      message: 'Auction event created successfully',
      event
    });
  } catch (error) {
    console.error('Error creating auction event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register for auction (Bidder only)
router.post('/register', authenticate, upload.single('teamImage'), async (req, res) => {
  try {
    const { teamName, ownerName } = req.body;
    
    if (!teamName || !ownerName) {
      return res.status(400).json({ message: 'Team name and owner name are required' });
    }
    
    const liveEvent = await AuctionEvent.findOne({ isLive: true });
    if (!liveEvent) {
      return res.status(404).json({ message: 'No live auction event found' });
    }
    
    // Check if user already registered
    const existingRegistration = liveEvent.registeredBidders.find(
      bidder => bidder.userId.toString() === req.user.id
    );
    if (existingRegistration) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }
    
    // Check if team name is unique
    const existingTeam = liveEvent.registeredBidders.find(
      bidder => bidder.teamName.toLowerCase() === teamName.toLowerCase()
    );
    if (existingTeam) {
      return res.status(400).json({ message: 'Team name already taken' });
    }
    
    // Check max bidders limit
    if (liveEvent.registeredBidders.length >= liveEvent.maxBidders) {
      return res.status(400).json({ message: 'Maximum bidders limit reached' });
    }
    
    const registration = {
      teamName,
      ownerName,
      teamImage: req.file ? `/uploads/teams/${req.file.filename}` : null,
      userId: req.user.id,
      purse: 0 // Will be set by admin
    };
    
    liveEvent.registeredBidders.push(registration);
    await liveEvent.save();
    
    res.status(201).json({
      message: 'Successfully registered for auction',
      registration
    });
  } catch (error) {
    console.error('Error registering for auction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update bidder purse (Admin only)
router.patch('/bidder/:bidderId/purse', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { bidderId } = req.params;
    const { purse } = req.body;
    
    const liveEvent = await AuctionEvent.findOne({ isLive: true });
    if (!liveEvent) {
      return res.status(404).json({ message: 'No live auction event found' });
    }
    
    const bidder = liveEvent.registeredBidders.id(bidderId);
    if (!bidder) {
      return res.status(404).json({ message: 'Bidder not found' });
    }
    
    bidder.purse = parseInt(purse) || 0;
    await liveEvent.save();
    
    res.json({
      message: 'Purse updated successfully',
      bidder
    });
  } catch (error) {
    console.error('Error updating purse:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start auction (Admin only)
router.post('/start', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const liveEvent = await AuctionEvent.findOne({ isLive: true })
      .populate('eventPlayers');
    
    if (!liveEvent) {
      return res.status(404).json({ message: 'No live auction event found' });
    }
    
    if (liveEvent.registeredBidders.length === 0) {
      return res.status(400).json({ message: 'No bidders registered' });
    }
    
    if (liveEvent.eventPlayers.length === 0) {
      return res.status(400).json({ message: 'No players added to event' });
    }
    
    liveEvent.isActive = true;
    await liveEvent.save();
    
    res.json({
      message: 'Auction started successfully',
      event: liveEvent
    });
  } catch (error) {
    console.error('Error starting auction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get auction statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const liveEvent = await AuctionEvent.findOne({ isLive: true })
      .populate('eventPlayers');
    
    if (!liveEvent) {
      return res.json({
        totalPlayers: 0,
        soldPlayers: 0,
        unsoldPlayers: 0,
        totalValue: 0,
        teamStats: []
      });
    }
    
    const soldPlayers = await Player.countDocuments({ 
      _id: { $in: liveEvent.eventPlayers },
      auctionStatus: 'sold' 
    });
    
    const unsoldPlayers = await Player.countDocuments({ 
      _id: { $in: liveEvent.eventPlayers },
      auctionStatus: 'unsold' 
    });
    
    const totalValue = await Player.aggregate([
      { $match: { 
        _id: { $in: liveEvent.eventPlayers },
        auctionStatus: 'sold' 
      }},
      { $group: { _id: null, total: { $sum: '$finalPrice' } } }
    ]);
    
    const teamStats = await Player.aggregate([
      { $match: { 
        _id: { $in: liveEvent.eventPlayers },
        auctionStatus: 'sold' 
      }},
      {
        $group: {
          _id: '$soldTo',
          players: { $sum: 1 },
          totalSpent: { $sum: '$finalPrice' }
        }
      },
      { $sort: { totalSpent: -1 } }
    ]);
    
    res.json({
      totalPlayers: liveEvent.eventPlayers.length,
      soldPlayers,
      unsoldPlayers,
      totalValue: totalValue[0]?.total || 0,
      teamStats
    });
  } catch (error) {
    console.error('Error fetching auction stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;