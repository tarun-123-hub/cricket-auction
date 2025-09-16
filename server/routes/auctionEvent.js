const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const AuctionEvent = require('../models/AuctionEvent');
const AuctionEventPlayer = require('../models/AuctionEventPlayer');
const Bid = require('../models/Bid');
const Player = require('../models/Player');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all auction events
router.get('/', authenticate, async (req, res) => {
  try {
    // Get events with aggregated counts
    const events = await AuctionEvent.aggregate([
      {
        $lookup: {
          from: 'auctioneventplayers',
          localField: '_id',
          foreignField: 'auctionId',
          as: 'eventPlayerDetails'
        }
      },
      {
        $addFields: {
          playersCount: { $size: '$eventPlayerDetails' },
          registeredTeamsCount: { $size: '$registeredBidders' }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);
    
    // Populate the events
    await AuctionEvent.populate(events, [
      { path: 'eventPlayers', select: 'name role basePrice image age country' },
      { path: 'registeredBidders.userId', select: 'username email' },
      { path: 'createdBy', select: 'username' }
    ]);
    
    res.json(events);
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
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { 
      eventName, 
      eventDescription, 
      startTime,
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
    
    // Validate max bidders
    const maxBiddersNum = parseInt(maxBidders) || 8;
    if (maxBiddersNum < 2 || maxBiddersNum > 16) {
      return res.status(400).json({ message: 'Max bidders must be between 2 and 16' });
    }
    
    // Validate team purse default
    const teamPurseDefaultNum = parseInt(teamPurseDefault) || 10000000;
    if (teamPurseDefaultNum < 0) {
      return res.status(400).json({ message: 'Team purse default must be non-negative' });
    }
    
    // Validate players and their auction prices
    const playerValidation = [];
    for (const playerData of eventPlayers) {
      if (!playerData.playerId || !mongoose.Types.ObjectId.isValid(playerData.playerId)) {
        return res.status(400).json({ message: 'Invalid player ID provided' });
      }
      
      if (playerData.auctionPrice === undefined || playerData.auctionPrice === null || playerData.auctionPrice < 0) {
        const player = await Player.findById(playerData.playerId);
        return res.status(400).json({ 
          message: `Player ${player?.name || 'Unknown'} missing auction price` 
        });
      }
      
      playerValidation.push({
        playerId: playerData.playerId,
        auctionPrice: parseInt(playerData.auctionPrice),
        orderIndex: playerData.orderIndex || 0
      });
    }
    
    // Verify all players exist
    const playerIds = playerValidation.map(p => p.playerId);
    const existingPlayers = await Player.find({ _id: { $in: playerIds } });
    if (existingPlayers.length !== playerIds.length) {
      return res.status(400).json({ message: 'One or more players do not exist' });
    }
    
    // Create the event
    const event = new AuctionEvent({
      eventName: eventName.trim(),
      eventDescription: eventDescription?.trim() || '',
      startTime: startTime ? new Date(startTime) : null,
      maxPlayers: parseInt(maxPlayers) || playerValidation.length,
      maxBidders: maxBiddersNum,
      teamPurseDefault: teamPurseDefaultNum,
      timerSeconds: parseInt(timerSeconds) || 60,
      incrementOnBidSeconds: parseInt(incrementOnBidSeconds) || 30,
      randomizeOrder: Boolean(randomizeOrder),
      eventPlayers: playerIds,
      createdBy: req.user.id,
      status: 'draft'
    });
    
    await event.save({ session });
    
    // Create AuctionEventPlayer entries
    const eventPlayerEntries = playerValidation.map(p => ({
      auctionId: event._id,
      playerId: p.playerId,
      auctionPrice: p.auctionPrice,
      orderIndex: p.orderIndex
    }));
    
    await AuctionEventPlayer.insertMany(eventPlayerEntries, { session });
    
    await session.commitTransaction();
    
    // Populate the created event
    await event.populate([
      { path: 'eventPlayers', select: 'name role basePrice image age country' },
      { path: 'createdBy', select: 'username' }
    ]);
    
    // Add counts
    const eventWithCounts = {
      ...event.toObject(),
      playersCount: eventPlayerEntries.length,
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
    await session.abortTransaction();
    console.error('Error creating auction event:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Event name already exists' });
    }
    
    res.status(500).json({ 
      message: 'Failed to create auction event',
      error: error.message 
    });
  } finally {
    session.endSession();
  }
});

// Update auction event (Admin only)
router.put('/:id', authenticate, requireRole(['admin']), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const eventId = req.params.id;
    const { 
      eventName, 
      eventDescription, 
      startTime,
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
    if (startTime) event.startTime = new Date(startTime);
    if (maxBidders) event.maxBidders = parseInt(maxBidders);
    if (teamPurseDefault !== undefined) event.teamPurseDefault = parseInt(teamPurseDefault);
    if (timerSeconds) event.timerSeconds = parseInt(timerSeconds);
    if (incrementOnBidSeconds) event.incrementOnBidSeconds = parseInt(incrementOnBidSeconds);
    if (randomizeOrder !== undefined) event.randomizeOrder = Boolean(randomizeOrder);
    
    // Update players if provided
    if (eventPlayers && Array.isArray(eventPlayers)) {
      // Remove existing event players
      await AuctionEventPlayer.deleteMany({ auctionId: eventId }, { session });
      
      // Validate and add new players
      const playerValidation = [];
      for (const playerData of eventPlayers) {
        if (!playerData.playerId || !mongoose.Types.ObjectId.isValid(playerData.playerId)) {
          return res.status(400).json({ message: 'Invalid player ID provided' });
        }
        
        if (playerData.auctionPrice === undefined || playerData.auctionPrice === null || playerData.auctionPrice < 0) {
          const player = await Player.findById(playerData.playerId);
          return res.status(400).json({ 
            message: `Player ${player?.name || 'Unknown'} missing auction price` 
          });
        }
        
        playerValidation.push({
          playerId: playerData.playerId,
          auctionPrice: parseInt(playerData.auctionPrice),
          orderIndex: playerData.orderIndex || 0
        });
      }
      
      // Create new AuctionEventPlayer entries
      const eventPlayerEntries = playerValidation.map(p => ({
        auctionId: eventId,
        playerId: p.playerId,
        auctionPrice: p.auctionPrice,
        orderIndex: p.orderIndex
      }));
      
      await AuctionEventPlayer.insertMany(eventPlayerEntries, { session });
      
      // Update event players array
      event.eventPlayers = playerValidation.map(p => p.playerId);
      event.maxPlayers = playerValidation.length;
    }
    
    await event.save({ session });
    await session.commitTransaction();
    
    // Populate and return updated event
    await event.populate([
      { path: 'eventPlayers', select: 'name role basePrice image age country' },
      { path: 'registeredBidders.userId', select: 'username email' },
      { path: 'createdBy', select: 'username' }
    ]);
    
    // Get counts
    const eventPlayerCount = await AuctionEventPlayer.countDocuments({ auctionId: eventId });
    const eventWithCounts = {
      ...event.toObject(),
      playersCount: eventPlayerCount,
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
    await session.abortTransaction();
    console.error('Error updating event:', error);
    res.status(500).json({ 
      message: 'Failed to update event',
      error: error.message 
    });
  } finally {
    session.endSession();
  }
});

// Delete auction event (Admin only)
router.delete('/:id', authenticate, requireRole(['admin']), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const eventId = req.params.id;
    
    const event = await AuctionEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Don't allow deleting active events
    if (event.status === 'active') {
      return res.status(400).json({ message: 'Cannot delete active event' });
    }
    
    // Delete associated records
    await AuctionEventPlayer.deleteMany({ auctionId: eventId }, { session });
    await Bid.deleteMany({ auctionId: eventId }, { session });
    await AuctionEvent.findByIdAndDelete(eventId, { session });
    
    await session.commitTransaction();
    
    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emit('event:deleted', { eventId });
    }
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error deleting event:', error);
    res.status(500).json({ 
      message: 'Failed to delete event',
      error: error.message 
    });
  } finally {
    session.endSession();
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
      { status: 'paused', isLive: false, isActive: false }
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
    const eventPlayerCount = await AuctionEventPlayer.countDocuments({ auctionId: eventId });
    const eventWithCounts = {
      ...event.toObject(),
      playersCount: eventPlayerCount,
      registeredTeamsCount: event.registeredBidders.length
    };
    
    // Emit socket event
    if (req.app.get('io')) {
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
      { status: 'paused', isLive: false, isActive: false },
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Emit socket event
    if (req.app.get('io')) {
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