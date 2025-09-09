const express = require('express');
const multer = require('multer');
const path = require('path');
const Player = require('../models/Player');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/players/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'player-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
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
const uploadsDir = 'uploads/players';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Get all players
// Get all players
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, role, country } = req.query;
    let query = { isActive: true };

    if (status) query.auctionStatus = status;
    if (role) query.role = role;
    if (country) query.country = country;

    const players = await Player.find(query).sort({ createdAt: -1 });
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single player
router.get('/:id', authenticate, async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    res.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new player (Admin only)
router.post(
  '/',
  authenticate,
  requireRole(['admin']),
  upload.single('image'),
  async (req, res) => {
    try {
      const playerData = {
        ...req.body,
        basePrice: parseInt(req.body.basePrice),
        age: parseInt(req.body.age)
      };

      if (req.file) {
        playerData.image = `/uploads/players/${req.file.filename}`;
      }

      // Parse stats if provided
      if (req.body.stats) {
        try {
          playerData.stats = typeof req.body.stats === 'string' 
            ? JSON.parse(req.body.stats) 
            : req.body.stats;
        } catch (e) {
          console.error('Error parsing stats:', e);
        }
      }

      const player = new Player(playerData);
      await player.save();

      res.status(201).json({
        message: 'Player created successfully',
        player
      });
    } catch (error) {
      console.error('Error creating player:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update player (Admin only)
router.put('/:id', authenticate, requireRole(['admin']), upload.single('image'), async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      basePrice: req.body.basePrice ? parseInt(req.body.basePrice) : undefined,
      age: req.body.age ? parseInt(req.body.age) : undefined
    };

    if (req.file) {
      updateData.image = `/uploads/players/${req.file.filename}`;
    }

    // Parse stats if provided
    if (req.body.stats) {
      try {
        updateData.stats = typeof req.body.stats === 'string' 
          ? JSON.parse(req.body.stats) 
          : req.body.stats;
      } catch (e) {
        console.error('Error parsing stats:', e);
      }
    }

    const player = await Player.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    res.json({
      message: 'Player updated successfully',
      player
    });
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete player (Admin only)
router.delete('/:id', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update auction status (Admin only)
router.patch('/:id/auction-status', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { status, soldTo, finalPrice } = req.body;
    
    const updateData = { auctionStatus: status };
    if (status === 'sold') {
      updateData.soldTo = soldTo;
      updateData.finalPrice = finalPrice;
    }

    const player = await Player.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    res.json({
      message: 'Player auction status updated',
      player
    });
  } catch (error) {
    console.error('Error updating auction status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;