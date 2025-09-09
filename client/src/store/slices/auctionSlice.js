import { createSlice } from '@reduxjs/toolkit'
import toast from 'react-hot-toast'

const auctionSlice = createSlice({
  name: 'auction',
  initialState: {
    isActive: false,
    isEventLive: false,
    currentPlayer: null,
    currentBid: 0,
    baseBid: 0,
    eventName: '',
    eventDescription: '',
    maxPlayers: 0,
    eventPlayers: [],
    bidders: [],
    timer: 30,
    soldPlayers: [],
    unsoldPlayers: [],
    teams: {},
    lastResult: null,
    bidHistory: [],
  },
  reducers: {
    setAuctionState: (state, action) => {
      return { ...state, ...action.payload }
    },
    createEvent: (state, action) => {
      state.eventName = action.payload.eventName || 'Auction Event'
      state.eventDescription = action.payload.eventDescription || ''
      state.maxPlayers = Number(action.payload.maxPlayers) || 0
      state.eventPlayers = action.payload.eventPlayers || []
      state.isEventLive = false
    },
    activateEvent: (state) => {
      state.isEventLive = true
    },
    deactivateEvent: (state) => {
      state.isEventLive = false
    },
    startAuction: (state, action) => {
      state.isActive = true
      state.currentPlayer = action.payload.currentPlayer
      state.currentBid = action.payload.currentBid || action.payload.currentPlayer?.basePrice || 0
      state.baseBid = action.payload.baseBid || action.payload.currentPlayer?.basePrice || 0
      state.eventName = action.payload.eventName || state.eventName || 'Auction Event'
      state.maxPlayers = Number(action.payload.maxPlayers || state.maxPlayers) || 0
      state.bidders = []
      state.timer = 30
      state.lastResult = null
    },
    auctionEnded: (state, action) => {
      console.log('auctionEnded reducer: Received auction-ended event with payload:', action.payload);
      state.isActive = false;
      state.lastResult = action.payload.result;

      if (action.payload.result.sold) {
        state.soldPlayers.push({
          ...state.currentPlayer,
          finalPrice: state.currentBid,
          soldTo: action.payload.result.team,
          soldAt: new Date().toISOString(),
        });
      } else {
        state.unsoldPlayers.push(state.currentPlayer);
      }

      // Clear current auction data
      state.currentPlayer = null;
      state.currentBid = 0;
      state.baseBid = 0;
      state.bidders = [];
      state.timer = 30;
    },
    newBid: (state, action) => {
      state.currentBid = action.payload.amount
      state.timer = action.payload.timer || 30
      
      // Add to bidders list
      const newBidder = {
        user: action.payload.bidder,
        team: action.payload.team,
        amount: action.payload.amount,
        timestamp: new Date().toISOString()
      }
      
      state.bidders.push(newBidder)
      
      // Add to bid history
      state.bidHistory.push(newBidder)
      
      // Keep only last 50 bids in history
      if (state.bidHistory.length > 50) {
        state.bidHistory = state.bidHistory.slice(-50)
      }
    },
    updateTimer: (state, action) => {
      state.timer = action.payload
    },
    placeBidError: (state, action) => {
      // Handle bid errors
      console.error('Bid error:', action.payload)
    },
    resetAuction: (state) => {
      state.isActive = false
      state.currentPlayer = null
      state.currentBid = 0
      state.baseBid = 0
      state.bidders = []
      state.timer = 30
      state.soldPlayers = []
      state.unsoldPlayers = []
      state.teams = {}
      state.lastResult = null
      state.bidHistory = []
    },
    updateSoldPlayers: (state, action) => {
      state.soldPlayers = action.payload
    },
    updateUnsoldPlayers: (state, action) => {
      state.unsoldPlayers = action.payload
    },
  },
})

export const {
  setAuctionState,
  createEvent,
  activateEvent,
  deactivateEvent,
  startAuction,
  auctionEnded,
  newBid,
  updateTimer,
  placeBidError,
  resetAuction,
  updateSoldPlayers,
  updateUnsoldPlayers,
} = auctionSlice.actions

// Thunk for placing a bid
export const placeBid = (amount) => (dispatch, getState) => {
  const { socket } = getState().socket
  const { currentBid, isActive } = getState().auction
  const { user, token } = getState().auth
  
  const isDemo = typeof token === 'string' && token.startsWith('local_dev_token')
  
  if (!isActive) {
    toast.error('No active auction')
    return
  }
  
  if (amount <= currentBid) {
    toast.error('Bid must be higher than current bid')
    return
  }
  
  if (isDemo || !socket) {
    dispatch(newBid({ amount, bidder: user?.username || 'Bidder', team: 'Demo', timer: 30 }))
    toast.success('Bid placed')
    return
  }

  if (!socket.connected) {
    toast.error('Not connected to auction room')
    return
  }

  socket.emit('place-bid', { amount })
}

// Thunk for starting auction (admin only)
export const startAuctionAction = (playerData) => (dispatch, getState) => {
  const { socket } = getState().socket
  
  if (!socket || !socket.connected) {
    toast.error('Not connected to auction room')
    return
  }
  
  socket.emit('start-auction', playerData)
}

// Thunk for ending auction (admin only)
export const endAuctionAction = (result) => (dispatch, getState) => {
  const { socket } = getState().socket
  
  if (!socket || !socket.connected) {
    toast.error('Not connected to auction room')
    console.log('endAuctionAction: Socket not connected or not available.'); // Added log
    return
  }
  
  console.log('endAuctionAction: Emitting end-auction with result:', result); // Modified log
  socket.emit('end-auction', result)
}

export default auctionSlice.reducer