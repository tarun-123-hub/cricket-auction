const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/players');
const auctionRoutes = require('./routes/auction');
const { connectDB } = require('./config/database');
const { authenticateSocket } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
};

const io = socketIo(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/auction', auctionRoutes);

// Global auction state
let auctionState = {
  isActive: false,
  currentPlayer: null,
  currentBid: 0,
  baseBid: 0,
  bidders: [],
  timer: 30,
  soldPlayers: [],
  unsoldPlayers: [],
  teams: {}
};

// Socket.IO connection handling
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.username} (${socket.user.role})`);
  
  // Join user to appropriate room based on role
  socket.join(socket.user.role);
  
  // Send current auction state to newly connected user
  socket.emit('auction-state', auctionState);
  
  // Admin controls
  if (socket.user.role === 'admin') {
    socket.on('start-auction', (playerData) => {
      auctionState.isActive = true;
      auctionState.currentPlayer = playerData;
      auctionState.currentBid = playerData.basePrice;
      auctionState.baseBid = playerData.basePrice;
      auctionState.bidders = [];
      auctionState.timer = 30;
      
      io.emit('auction-started', auctionState);
      startTimer();
    });
    
    socket.on('end-auction', (result) => {
      auctionState.isActive = false;
      
      if (result.sold) {
        auctionState.soldPlayers.push({
          ...auctionState.currentPlayer,
          finalPrice: auctionState.currentBid,
          soldTo: result.team,
          soldAt: new Date()
        });
      } else {
        auctionState.unsoldPlayers.push(auctionState.currentPlayer);
      }
      
      io.emit('auction-ended', {
        player: auctionState.currentPlayer,
        result: result,
        soldPlayers: auctionState.soldPlayers,
        unsoldPlayers: auctionState.unsoldPlayers
      });
      
      auctionState.currentPlayer = null;
      auctionState.currentBid = 0;
      auctionState.bidders = [];
    });
  }
  
  // Bidding functionality
  if (socket.user.role === 'bidder') {
    socket.on('place-bid', (bidData) => {
      if (!auctionState.isActive || !auctionState.currentPlayer) {
        socket.emit('bid-error', 'No active auction');
        return;
      }
      
      const newBid = bidData.amount;
      if (newBid <= auctionState.currentBid) {
        socket.emit('bid-error', 'Bid must be higher than current bid');
        return;
      }
      
      auctionState.currentBid = newBid;
      auctionState.bidders.push({
        user: socket.user.username,
        team: socket.user.team,
        amount: newBid,
        timestamp: new Date()
      });
      
      // Reset timer on new bid
      auctionState.timer = 30;
      
      io.emit('new-bid', {
        bidder: socket.user.username,
        team: socket.user.team,
        amount: newBid,
        currentBid: auctionState.currentBid,
        timer: auctionState.timer
      });
    });
  }
  
  // Chat functionality
  socket.on('send-message', (message) => {
    const chatMessage = {
      user: socket.user.username,
      role: socket.user.role,
      message: message.text,
      timestamp: new Date()
    };
    
    io.emit('new-message', chatMessage);
  });
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.username}`);
  });
});

// Timer functionality
let timerInterval;

function startTimer() {
  clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    auctionState.timer--;
    
    if (auctionState.timer <= 0) {
      clearInterval(timerInterval);
      
      // Auto-end auction
      const result = auctionState.bidders.length > 0 
        ? { sold: true, team: auctionState.bidders[auctionState.bidders.length - 1].team }
        : { sold: false };
      
      io.emit('auction-ended', {
        player: auctionState.currentPlayer,
        result: result,
        soldPlayers: auctionState.soldPlayers,
        unsoldPlayers: auctionState.unsoldPlayers
      });
      
      auctionState.isActive = false;
      auctionState.currentPlayer = null;
      auctionState.currentBid = 0;
      auctionState.bidders = [];
    } else {
      io.emit('timer-update', auctionState.timer);
    }
  }, 1000);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
});