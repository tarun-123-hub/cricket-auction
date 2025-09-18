const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Player = require('../models/Player');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure absolute path is used
    const uploadPath = path.join(__dirname, '..', 'uploads', 'players');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
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


// Upload image endpoint
router.post('/upload', authenticate, requireRole(['admin']), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    res.json({
      message: 'Image uploaded successfully',
      imagePath: `/uploads/players/${req.file.filename}`
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
});

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
      console.log('Creating player with data:', req.body);
      
      const playerData = {
        name: (req.body.name || '').trim(),
        role: req.body.role,
        basePrice: parseInt(req.body.basePrice, 10),
        age: parseInt(req.body.age, 10),
        country: (req.body.country || '').trim(),
        battingStyle: req.body.battingStyle,
        bowlingStyle: req.body.bowlingStyle || 'None'
      };

      if (req.file) {
        // Store the correct path in the database
        playerData.image = `/uploads/players/${req.file.filename}`;
        console.log('Image uploaded successfully:', req.file.filename, 'Full path:', req.file.path);
      } else {
        console.log('No image file received in request');
      }

      // Parse stats if provided
      if (req.body.stats) {
        try {
          const stats = typeof req.body.stats === 'string' 
            ? JSON.parse(req.body.stats) 
            : req.body.stats;
          playerData.stats = {
            matches: parseInt(stats.matches || 0, 10),
            runs: parseInt(stats.runs || 0, 10),
            wickets: parseInt(stats.wickets || 0, 10),
            average: parseFloat(stats.average || 0),
            strikeRate: parseFloat(stats.strikeRate || 0)
          };
        } catch (e) {
          console.error('Error parsing stats:', e);
          playerData.stats = { matches: 0, runs: 0, wickets: 0, average: 0, strikeRate: 0 };
        }
      }

      const player = new Player(playerData);
      console.log('Saving player:', player);
      await player.save();
      console.log('Player saved successfully:', player._id);

      // Emit socket event
      if (req.app && req.app.get('io')) {
        req.app.get('io').emit('player:added', player);
        
        if (req.file) {
          req.app.get('io').emit('player:image_uploaded', {
            playerId: player._id,
            photoUrl: playerData.image
          });
        }
      }

      res.status(201).json({
        message: 'Player created successfully',
        player
      });
    } catch (error) {
      console.error('Error creating player:', error);
      
      // Clean up uploaded file if player creation failed
      if (req.file) {
        try {
          const filePath = path.join(__dirname, '..', 'uploads', 'players', req.file.filename);
          fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting uploaded file:', err);
          });
        } catch (err) {
          console.error('Error handling file cleanup:', err);
        }
      }
      
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

    // Emit socket event
    if (req.app && req.app.get('io')) {
      req.app.get('io').emit('player:updated', player);
      
      if (req.file) {
        req.app.get('io').emit('player:image_uploaded', {
          playerId: player._id,
          photoUrl: updateData.image
        });
      }
    }

    res.json({
      message: 'Player updated successfully',
      player
    });
  } catch (error) {
    console.error('Error updating player:', error);
    
    // Clean up uploaded file if update failed
    if (req.file) {
      const fs = require('fs');
      const filePath = path.join(__dirname, '../uploads/players', req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }
    
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