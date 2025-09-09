const express = require('express');
const Player = require('../models/Player');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get auction statistics
// Get auction statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const totalPlayers = await Player.countDocuments({ isActive: true });
    const soldPlayers = await Player.countDocuments({ auctionStatus: 'sold' });
    const unsoldPlayers = await Player.countDocuments({ auctionStatus: 'unsold' });
    const pendingPlayers = await Player.countDocuments({ auctionStatus: 'pending' });

    const totalValue = await Player.aggregate([
      { $match: { auctionStatus: 'sold' } },
      { $group: { _id: null, total: { $sum: '$finalPrice' } } }
    ]);

    const teamStats = await Player.aggregate([
      { $match: { auctionStatus: 'sold' } },
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
      totalPlayers,
      soldPlayers,
      unsoldPlayers,
      pendingPlayers,
      totalValue: totalValue[0]?.total || 0,
      teamStats
    });
  } catch (error) {
    console.error('Error fetching auction stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sold players
router.get('/sold', authenticate, async (req, res) => {
  try {
    const soldPlayers = await Player.find({ auctionStatus: 'sold' })
      .sort({ updatedAt: -1 });
    res.json(soldPlayers);
  } catch (error) {
    console.error('Error fetching sold players:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unsold players
router.get('/unsold', authenticate, async (req, res) => {
  try {
    const unsoldPlayers = await Player.find({ auctionStatus: 'unsold' })
      .sort({ updatedAt: -1 });
    res.json(unsoldPlayers);
  } catch (error) {
    console.error('Error fetching unsold players:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset auction (Admin only)
router.post('/reset', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    await Player.updateMany(
      {},
      {
        $set: {
          auctionStatus: 'pending',
          soldTo: null,
          finalPrice: null
        }
      }
    );

    res.json({ message: 'Auction reset successfully' });
  } catch (error) {
    console.error('Error resetting auction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;