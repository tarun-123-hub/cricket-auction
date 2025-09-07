import { createSlice } from '@reduxjs/toolkit'
import toast from 'react-hot-toast'

const auctionSlice = createSlice({
  name: 'auction',
  initialState: {
    isActive: false,
    currentPlayer: null,
    currentBid: 0,
    baseBid: 0,
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
    startAuction: (state, action) => {
      state.isActive = true
      state.currentPlayer = action.payload.currentPlayer
      state.currentBid = action.payload.currentBid || action.payload.currentPlayer?.basePrice || 0
      state.baseBid = action.payload.baseBid || action.payload.currentPlayer?.basePrice || 0
      state.bidders = []
      state.timer = 30
      state.lastResult = null
    },
    endAuction: (state, action) => {
      state.isActive = false
      state.lastResult = action.payload.result
      
      if (action.payload.result.sold) {
        state.soldPlayers.push({
          ...state.currentPlayer,
          finalPrice: state.currentBid,
          soldTo: action.payload.result.team,
          soldAt: new Date().toISOString()
        })
      } else {
        state.unsoldPlayers.push(state.currentPlayer)
      }
      
      // Clear current auction data
      state.currentPlayer = null
      state.currentBid = 0
      state.baseBid = 0
      state.bidders = []
      state.timer = 30
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
  startAuction,
  endAuction,
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
  
  if (!socket || !socket.connected) {
    toast.error('Not connected to auction room')
    return
  }
  
  if (!isActive) {
    toast.error('No active auction')
    return
  }
  
  if (amount <= currentBid) {
    toast.error('Bid must be higher than current bid')
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
    return
  }
  
  socket.emit('end-auction', result)
}

export default auctionSlice.reducer