const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/players');
const auctionRoutes = require('./routes/auction');
const { connectDB } = require('./config/database');
const { authenticateSocket } = require('./middleware/auth');
const Player = require('./models/Player');

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'], // Added http://localhost:3001
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
// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'a-very-strong-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
});
app.use(sessionMiddleware);

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
  isEventLive: false,
  eventName: '',
  eventDescription: '',
  maxPlayers: 0,
  eventPlayers: [],
  currentPlayer: null,
  currentBid: 0,
  baseBid: 0,
  bidders: [],
  timer: 60,
  soldPlayers: [],
  unsoldPlayers: [],
  teams: {
    'Team A': { name: 'Team A', purse: 10000000, players: [] },
    'Team B': { name: 'Team B', purse: 10000000, players: [] },
    'Team C': { name: 'Team C', purse: 10000000, players: [] },
    'Team D': { name: 'Team D', purse: 10000000, players: [] }
  },
  remainingPlayers: [],
  currentPlayerIndex: 0,
  isEventComplete: false
};

// Socket.IO connection handling
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});
io.use(authenticateSocket);

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
    socket.on('activate-event', (payload) => {
      auctionState.isEventLive = true;
      auctionState.eventName = payload.eventName || auctionState.eventName;
      auctionState.eventDescription = payload.eventDescription || '';
      auctionState.maxPlayers = Number(payload.maxPlayers || 0);
      auctionState.eventPlayers = Array.isArray(payload.eventPlayers) ? payload.eventPlayers : [];
      io.emit('event-activated', {
        eventName: auctionState.eventName,
        maxPlayers: auctionState.maxPlayers
      });
    });
    socket.on('start-auction', (playerData) => {
      auctionState.isActive = true;
      auctionState.currentPlayer = playerData;
      auctionState.currentBid = playerData.basePrice;
      auctionState.baseBid = playerData.basePrice;
      auctionState.bidders = [];
      auctionState.timer = 60;
      
      // Set remaining players if not already set
      if (auctionState.remainingPlayers.length === 0 && auctionState.eventPlayers.length > 0) {
        auctionState.remainingPlayers = [...auctionState.eventPlayers];
      }
      
      io.emit('auction-started', auctionState);
      startTimer();
    });
    
    socket.on('start-next-player', () => {
      if (auctionState.remainingPlayers.length > 0) {
        const nextPlayer = auctionState.remainingPlayers[0];
        auctionState.isActive = true;
        auctionState.currentPlayer = nextPlayer;
        auctionState.currentBid = nextPlayer.basePrice;
        auctionState.baseBid = nextPlayer.basePrice;
        auctionState.bidders = [];
        auctionState.timer = 60;
        auctionState.currentPlayerIndex++;
        
        io.emit('auction-started', auctionState);
        startTimer();
      } else {
        auctionState.isEventComplete = true;
        io.emit('auction-event-complete', {
          eventName: auctionState.eventName,
          soldPlayers: auctionState.soldPlayers,
          unsoldPlayers: auctionState.unsoldPlayers,
          teams: auctionState.teams
        });
      }
    });
    
    socket.on('end-auction', async (result) => {
      console.log('Server: Received end-auction event with result:', result);
      auctionState.isActive = false;

      if (auctionState.currentPlayer) {
        console.log('Server: Current player in auctionState:', auctionState.currentPlayer.name);
        try {
          const player = await Player.findById(auctionState.currentPlayer._id);
          if (player) {
            console.log('Server: Found player in DB:', player.name);
            
            let winningTeam = null;
            if (result.sold && auctionState.bidders.length > 0) {
              winningTeam = auctionState.bidders[auctionState.bidders.length - 1].team;
            }

            player.auctionStatus = result.sold && winningTeam ? 'sold' : 'unsold';
            
            if (result.sold && winningTeam) {
              player.finalPrice = auctionState.currentBid;
              player.soldTo = winningTeam;
              
              // Update team data
              if (auctionState.teams[winningTeam]) {
                auctionState.teams[winningTeam].purse -= auctionState.currentBid;
                auctionState.teams[winningTeam].players.push({
                  ...auctionState.currentPlayer,
                  finalPrice: auctionState.currentBid,
                  soldTo: winningTeam
                });
              }
            } else {
              player.finalPrice = null;
              player.soldTo = null;
            }
            await player.save();
            console.log('Server: Player status updated and saved to DB:', player.name, player.auctionStatus);

            // Update in-memory state after successful DB save
            if (result.sold && winningTeam) {
              auctionState.soldPlayers.push({
                ...auctionState.currentPlayer,
                finalPrice: auctionState.currentBid,
                soldTo: winningTeam,
                soldAt: new Date()
              });
            } else {
              auctionState.unsoldPlayers.push(auctionState.currentPlayer);
            }
            
            // Remove current player from remaining players
            auctionState.remainingPlayers = auctionState.remainingPlayers.filter(p => p._id !== auctionState.currentPlayer._id);
            
            // Check if auction is complete
            if (auctionState.remainingPlayers.length === 0) {
              auctionState.isEventComplete = true;
            }
            
            io.emit('auction-ended', {
              player: auctionState.currentPlayer,
              result: { sold: result.sold && winningTeam, team: winningTeam },
              soldPlayers: auctionState.soldPlayers,
              unsoldPlayers: auctionState.unsoldPlayers,
              remainingPlayers: auctionState.remainingPlayers,
              isEventComplete: auctionState.isEventComplete,
              teams: auctionState.teams
            });
            console.log('Server: Emitted auction-ended event.');

          } else {
            console.log('Server: Player not found in DB for ID:', auctionState.currentPlayer._id);
          }
        } catch (error) {
          console.error('Server: Error updating player status in DB:', error);
          socket.emit('auction-error', 'Failed to update player status in database.');
        }
      } else {
        console.log('Server: auctionState.currentPlayer is null or undefined when end-auction received.');
      }
      
      auctionState.currentPlayer = null;
      auctionState.currentBid = 0;
      auctionState.bidders = [];
    });
    
    // Admin sold/unsold quick actions
    socket.on('admin-result', (data) => {
      if (!auctionState.currentPlayer) return;
      const sold = !!data?.sold;
      const team = data?.team || 'AdminDecision';
      const result = sold ? { sold: true, team } : { sold: false };
      
      // Update team data if sold
      if (sold && auctionState.teams[team]) {
        auctionState.teams[team].purse -= auctionState.currentBid;
        auctionState.teams[team].players.push({
          ...auctionState.currentPlayer,
          finalPrice: auctionState.currentBid,
          soldTo: team
        });
      }
      
      io.emit('auction-ended', {
        player: auctionState.currentPlayer,
        result,
        soldPlayers: auctionState.soldPlayers,
        unsoldPlayers: auctionState.unsoldPlayers,
        teams: auctionState.teams
      });
      
      auctionState.isActive = false;
      if (sold) {
        auctionState.soldPlayers.push({
          ...auctionState.currentPlayer,
          finalPrice: auctionState.currentBid,
          soldTo: team,
          soldAt: new Date()
        });
      } else {
        auctionState.unsoldPlayers.push(auctionState.currentPlayer);
      }
      auctionState.currentPlayer = null;
      auctionState.currentBid = 0;
      auctionState.bidders = [];
      
      // Remove from remaining players
      auctionState.remainingPlayers = auctionState.remainingPlayers.filter(p => p._id !== auctionState.currentPlayer._id);
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
      auctionState.timer = 60;
      
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