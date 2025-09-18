const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const AuctionEvent = require('../models/AuctionEvent');
const Bid = require('../models/Bid');
const Player = require('../models/Player');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all auction events
router.get('/', authenticate, async (req, res) => {
  try {
    const events = await AuctionEvent.find()
      .populate('eventPlayers', 'name role basePrice image age country')
      .populate('registeredBidders.userId', 'username email')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    
    // Add counts to each event
    const eventsWithCounts = events.map(event => ({
      ...event.toObject(),
      playersCount: event.eventPlayers.length,
      registeredTeamsCount: event.registeredBidders.length
    }));
    
    res.json(eventsWithCounts);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all auction events (legacy endpoint)
router.get('/all', authenticate, async (req, res) => {
  try {
    const events = await AuctionEvent.find()
      .populate('eventPlayers', 'name category specialty basePrice image age country role battingStyle bowlingStyle')
      .populate('registeredBidders.userId', 'username email')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching all events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create auction event (Admin only) - Enhanced version
router.post('/', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { 
      eventName, 
      eventDescription, 
      maxPlayers, 
      maxBidders, 
      teamPurseDefault,
      timerSeconds,
      incrementOnBidSeconds,
      randomizeOrder,
      eventPlayers 
    } = req.body;
    
    // Validation
    if (!eventName || !eventName.trim()) {
      return res.status(400).json({ message: 'Event name is required' });
    }
    
    if (!eventPlayers || !Array.isArray(eventPlayers) || eventPlayers.length === 0) {
      return res.status(400).json({ message: 'At least one player must be selected' });
    }
    
    // Convert string IDs to ObjectIds if they're not already
    const processedEventPlayers = eventPlayers.map(playerData => {
      if (typeof playerData === 'string') {
        return playerData;
      }
      return playerData.playerId || playerData;
    }).filter(id => mongoose.Types.ObjectId.isValid(id));
    
    // Verify all players exist
    const playerIds = processedEventPlayers;
    const existingPlayers = await Player.find({ _id: { $in: playerIds } });
    if (existingPlayers.length !== playerIds.length) {
      return res.status(400).json({ message: 'One or more players do not exist' });
    }
    
    // Create the event
    const event = new AuctionEvent({
      eventName: eventName.trim(),
      eventDescription: eventDescription?.trim() || '',
      maxPlayers: parseInt(maxPlayers) || processedEventPlayers.length,
      maxBidders: parseInt(maxBidders) || 8,
      teamPurseDefault: parseInt(teamPurseDefault) || 10000000,
      timerSeconds: parseInt(timerSeconds) || 60,
      incrementOnBidSeconds: parseInt(incrementOnBidSeconds) || 30,
      randomizeOrder: Boolean(randomizeOrder),
      eventPlayers: processedEventPlayers,
      createdBy: req.user.id,
      status: 'draft'
    });
    
    await event.save();
    
    // Populate the created event
    await event.populate([
      { path: 'eventPlayers', select: 'name role basePrice image age country' },
      { path: 'createdBy', select: 'username' }
    ]);
    
    // Add counts
    const eventWithCounts = {
      ...event.toObject(),
      playersCount: processedEventPlayers.length,
      registeredTeamsCount: 0
    };
    
    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emit('event:created', eventWithCounts);
    }
    
    res.status(201).json({
      message: 'Auction event created successfully',
      event: eventWithCounts
    });
  } catch (error) {
    console.error('Error creating auction event:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Event name already exists' });
    }
    
    res.status(500).json({ 
      message: 'Failed to create auction event',
      error: error.message 
    });
  }
});

// Update auction event (Admin only)
router.put('/:id', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const eventId = req.params.id;
    const { 
      eventName, 
      eventDescription, 
      maxBidders, 
      teamPurseDefault,
      timerSeconds,
      incrementOnBidSeconds,
      randomizeOrder,
      eventPlayers 
    } = req.body;
    
    const event = await AuctionEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Don't allow editing active events
    if (event.status === 'active') {
      return res.status(400).json({ message: 'Cannot edit active event' });
    }
    
    // Update event fields
    if (eventName) event.eventName = eventName.trim();
    if (eventDescription !== undefined) event.eventDescription = eventDescription.trim();
    if (maxBidders) event.maxBidders = parseInt(maxBidders);
    if (teamPurseDefault !== undefined) event.teamPurseDefault = parseInt(teamPurseDefault);
    if (timerSeconds) event.timerSeconds = parseInt(timerSeconds);
    if (incrementOnBidSeconds) event.incrementOnBidSeconds = parseInt(incrementOnBidSeconds);
    if (randomizeOrder !== undefined) event.randomizeOrder = Boolean(randomizeOrder);
    
    // Update players if provided
    if (eventPlayers && Array.isArray(eventPlayers)) {
      // Convert string IDs to ObjectIds if they're not already
      const processedEventPlayers = eventPlayers.map(playerData => {
        if (typeof playerData === 'string') {
          return playerData;
        }
        return playerData.playerId || playerData;
      }).filter(id => mongoose.Types.ObjectId.isValid(id));
      
      // Update event players array
      event.eventPlayers = processedEventPlayers;
      event.maxPlayers = processedEventPlayers.length;
    }
    
    await event.save();
    
    // Populate and return updated event
    await event.populate([
      { path: 'eventPlayers', select: 'name role basePrice image age country' },
      { path: 'registeredBidders.userId', select: 'username email' },
      { path: 'createdBy', select: 'username' }
    ]);
    
    // Get counts
    const eventWithCounts = {
      ...event.toObject(),
      playersCount: event.eventPlayers.length,
      registeredTeamsCount: event.registeredBidders.length
    };
    
    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emit('event:updated', eventWithCounts);
    }
    
    res.json({
      message: 'Event updated successfully',
      event: eventWithCounts
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ 
      message: 'Failed to update event',
      error: error.message 
    });
  }
});

// Delete auction event (Admin only)
router.delete('/:id', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const eventId = req.params.id;
    
    const event = await AuctionEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Don't allow deleting active events
    if (event.status === 'active') {
      return res.status(400).json({ message: 'Cannot delete active event. Please deactivate it first.' });
    }
    
    // Delete associated records
    await Bid.deleteMany({ auctionId: eventId });
    await AuctionEvent.findByIdAndDelete(eventId);
    
    // Emit socket event
    if (req.app.get('io')) {
      console.log('Emitting event:deleted to all clients:', { eventId });
      req.app.get('io').emit('event:deleted', { eventId });
    }
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ 
      message: 'Failed to delete event',
      error: error.message 
    });
  }
});

// Live event info (must come before any `/:id` routes)
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

// Register for auction (Bidder only) (place before `/:id`)
const fs = require('fs');
const uploadsDir = 'uploads/teams';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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
    const existingRegistration = liveEvent.registeredBidders.find(
      bidder => bidder.userId.toString() === req.user.id
    );
    if (existingRegistration) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }
    const existingTeam = liveEvent.registeredBidders.find(
      bidder => bidder.teamName.toLowerCase() === teamName.toLowerCase()
    );
    if (existingTeam) {
      return res.status(400).json({ message: 'Team name already taken' });
    }
    if (liveEvent.registeredBidders.length >= liveEvent.maxBidders) {
      return res.status(409).json({ message: 'Max bidders reached' });
    }
    const registration = {
      teamName,
      ownerName,
      teamImage: req.file ? `/uploads/teams/${req.file.filename}` : null,
      userId: req.body.userId || req.user.id,
      purse: liveEvent.teamPurseDefault || 0,
      status: 'registered',
      registeredAt: new Date()
    };
    liveEvent.registeredBidders.push(registration);
    await liveEvent.save();
    if (req.app.get('io')) {
      req.app.get('io').emit('registration:added', { 
        eventId: liveEvent._id, 
        team: registration 
      });
    }
    res.status(201).json({
      message: 'Successfully registered for auction',
      registration
    });
  } catch (error) {
    console.error('Error registering for auction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Auction statistics (place before `/:id`)
router.get('/stats', authenticate, async (req, res) => {
  try {
    const liveEvent = await AuctionEvent.findOne({ isLive: true })
      .populate('eventPlayers');
    if (!liveEvent) {
      return res.json({ totalPlayers: 0, soldPlayers: 0, unsoldPlayers: 0, totalValue: 0, teamStats: [] });
    }
    const soldPlayers = await Player.countDocuments({ _id: { $in: liveEvent.eventPlayers }, auctionStatus: 'sold' });
    const unsoldPlayers = await Player.countDocuments({ _id: { $in: liveEvent.eventPlayers }, auctionStatus: 'unsold' });
    const totalValue = await Player.aggregate([
      { $match: { _id: { $in: liveEvent.eventPlayers }, auctionStatus: 'sold' }},
      { $group: { _id: null, total: { $sum: '$finalPrice' } } }
    ]);
    const teamStats = await Player.aggregate([
      { $match: { _id: { $in: liveEvent.eventPlayers }, auctionStatus: 'sold' }},
      { $group: { _id: '$soldTo', players: { $sum: 1 }, totalSpent: { $sum: '$finalPrice' } } },
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

// Get single event (keep after above routes)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const event = await AuctionEvent.findById(req.params.id)
      .populate('eventPlayers', 'name role basePrice image age country')
      .populate('registeredBidders.userId', 'username email')
      .populate('createdBy', 'username');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Activate specific event (Admin only)
router.post('/:id/activate', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const eventId = req.params.id;
    
    const event = await AuctionEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (event.status === 'active') {
      return res.status(400).json({ message: 'Event is already active' });
    }
    
    // Deactivate all other events (only one can be active)
    await AuctionEvent.updateMany(
      { status: 'active' }, 
      { status: 'draft', isLive: false, isActive: false }
    );
    
    // Activate the selected event
    event.status = 'active';
    event.isLive = true;
    await event.save();
    
    // Populate the event
    await event.populate([
      { path: 'eventPlayers', select: 'name role basePrice image age country' },
      { path: 'registeredBidders.userId', select: 'username email' },
      { path: 'createdBy', select: 'username' }
    ]);
    
    // Get counts
    const eventWithCounts = {
      ...event.toObject(),
      playersCount: event.eventPlayers.length,
      registeredTeamsCount: event.registeredBidders.length
    };
    
    // Emit socket event
    if (req.app.get('io')) {
      console.log('Emitting event:activated to all clients:', { eventId, event: eventWithCounts });
      req.app.get('io').emit('event:activated', { eventId, event: eventWithCounts });
    }
    
    res.json({
      message: 'Event activated successfully',
      event: eventWithCounts
    });
  } catch (error) {
    console.error('Error activating event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Deactivate specific event (Admin only)
router.post('/:id/deactivate', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const eventId = req.params.id;
    
    const event = await AuctionEvent.findByIdAndUpdate(
      eventId,
      { status: 'draft', isLive: false, isActive: false },
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Emit socket event
    if (req.app.get('io')) {
      console.log('Emitting event:deactivated to all clients:', { eventId });
      req.app.get('io').emit('event:deactivated', { eventId });
    }
    
    res.json({
      message: 'Event deactivated successfully',
      event
    });
  } catch (error) {
    console.error('Error deactivating event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create uploads directory if it doesn't exist
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
      return res.status(409).json({ message: 'Max bidders reached' });
    }
    
    const registration = {
      teamName,
      ownerName,
      teamImage: req.file ? `/uploads/teams/${req.file.filename}` : null,
      userId: req.user.id,
      purse: liveEvent.teamPurseDefault || 0,
      status: 'registered'
    };
    
    liveEvent.registeredBidders.push(registration);
    await liveEvent.save();
    
    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emit('registration:added', { 
        eventId: liveEvent._id, 
        team: registration 
      });
    }
    
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
    
    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emit('purse:updated', { 
        eventId: liveEvent._id, 
        bidderId, 
        purse: bidder.purse 
      });
    }
    
    res.json({
      message: 'Purse updated successfully',
      bidder
    });
  } catch (error) {
    console.error('Error updating purse:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve or reject bidder (Admin only)
router.patch('/bidder/:bidderId/status', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { bidderId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const liveEvent = await AuctionEvent.findOne({ isLive: true });
    if (!liveEvent) {
      return res.status(404).json({ message: 'No live auction event found' });
    }
    
    const bidder = liveEvent.registeredBidders.id(bidderId);
    if (!bidder) {
      return res.status(404).json({ message: 'Bidder not found' });
    }
    
    bidder.status = status;
    await liveEvent.save();
    
    if (req.app.get('io')) {
      req.app.get('io').emit('registration:status', { 
        eventId: liveEvent._id,
        bidderId,
        status
      });
    }
    
    res.json({ message: 'Status updated', bidder });
  } catch (error) {
    console.error('Error updating bidder status:', error);
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