import { createSlice } from '@reduxjs/toolkit'
import toast from 'react-hot-toast'

const auctionSlice = createSlice({
  name: 'auction',
  initialState: {
    isActive: false,
    isEventLive: false,
    isEventComplete: false,
    currentPlayer: null,
    currentBid: 0,
    baseBid: 0,
    eventName: '',
    eventDescription: '',
    maxPlayers: 0,
    eventPlayers: [],
    remainingPlayers: [],
    currentPlayerIndex: 0,
    bidders: [],
    timer: 30,
    soldPlayers: [],
    unsoldPlayers: [],
    teams: {
      'Team A': { name: 'Team A', purse: 10000000, players: [] },
      'Team B': { name: 'Team B', purse: 10000000, players: [] },
      'Team C': { name: 'Team C', purse: 10000000, players: [] },
      'Team D': { name: 'Team D', purse: 10000000, players: [] }
    },
    lastResult: null,
    bidHistory: [],
    auctionSummary: null,
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
      state.remainingPlayers = [...(action.payload.eventPlayers || [])]
      state.currentPlayerIndex = 0
      state.isEventLive = false
      state.isEventComplete = false
      state.soldPlayers = []
      state.unsoldPlayers = []
      // Reset team purses and players
      Object.keys(state.teams).forEach(teamName => {
        state.teams[teamName].purse = 10000000
        state.teams[teamName].players = []
      })
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
    startNextPlayer: (state) => {
      if (state.remainingPlayers.length > 0) {
        const nextPlayer = state.remainingPlayers[0]
        state.isActive = true
        state.currentPlayer = nextPlayer
        state.currentBid = nextPlayer.basePrice
        state.baseBid = nextPlayer.basePrice
        state.bidders = []
        state.timer = 30
        state.lastResult = null
        state.currentPlayerIndex++
      } else {
        state.isEventComplete = true
        state.isActive = false
        state.currentPlayer = null
      }
    },
    auctionEnded: (state, action) => {
      console.log('auctionEnded reducer: Received auction-ended event with payload:', action.payload);
      state.isActive = false;
      state.lastResult = action.payload.result;

      if (action.payload.result.sold && action.payload.result.team) {
        const soldPlayer = {
          ...state.currentPlayer,
          finalPrice: state.currentBid,
          soldTo: action.payload.result.team,
          soldAt: new Date().toISOString(),
        }
        state.soldPlayers.push(soldPlayer);
        
        // Update team purse and add player
        if (state.teams[action.payload.result.team]) {
          state.teams[action.payload.result.team].purse -= state.currentBid
          state.teams[action.payload.result.team].players.push(soldPlayer)
        }
      } else {
        state.unsoldPlayers.push({
          ...state.currentPlayer,
          unsoldAt: new Date().toISOString()
        });
      }

      // Remove current player from remaining players
      state.remainingPlayers = state.remainingPlayers.filter(p => p._id !== state.currentPlayer._id)

      // Check if auction is complete
      if (state.remainingPlayers.length === 0) {
        state.isEventComplete = true
        state.auctionSummary = {
          eventName: state.eventName,
          totalPlayers: state.eventPlayers.length,
          soldPlayers: state.soldPlayers,
          unsoldPlayers: state.unsoldPlayers,
          teams: state.teams,
          completedAt: new Date().toISOString()
        }
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
      state.isEventComplete = false
      state.currentPlayer = null
      state.currentBid = 0
      state.baseBid = 0
      state.bidders = []
      state.timer = 30
      state.soldPlayers = []
      state.unsoldPlayers = []
      state.remainingPlayers = []
      state.currentPlayerIndex = 0
      state.lastResult = null
      state.bidHistory = []
      state.auctionSummary = null
      // Reset teams
      Object.keys(state.teams).forEach(teamName => {
        state.teams[teamName].purse = 10000000
        state.teams[teamName].players = []
      })
    },
    updateSoldPlayers: (state, action) => {
      state.soldPlayers = action.payload
    },
    updateUnsoldPlayers: (state, action) => {
      state.unsoldPlayers = action.payload
    },
    completeAuctionEvent: (state) => {
      state.isEventComplete = true
      state.isActive = false
      state.auctionSummary = {
        eventName: state.eventName,
        totalPlayers: state.eventPlayers.length,
        soldPlayers: state.soldPlayers,
        unsoldPlayers: state.unsoldPlayers,
        teams: state.teams,
        completedAt: new Date().toISOString()
      }
    }
  },
})

export const {
  setAuctionState,
  createEvent,
  activateEvent,
  deactivateEvent,
  startAuction,
  startNextPlayer,
  auctionEnded,
  newBid,
  updateTimer,
  placeBidError,
  resetAuction,
  updateSoldPlayers,
  updateUnsoldPlayers,
  completeAuctionEvent,
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
    dispatch(newBid({ amount, bidder: user?.username || 'Bidder', team: 'Team A', timer: 30 }))
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
    console.log('endAuctionAction: Socket not connected or not available.');
    return
  }
  
  console.log('endAuctionAction: Emitting end-auction with result:', result);
  socket.emit('end-auction', result)
}

// Thunk for starting next player auction
export const startNextPlayerAction = () => (dispatch, getState) => {
  const { socket } = getState().socket
  const { remainingPlayers } = getState().auction
  
  if (remainingPlayers.length === 0) {
    dispatch(completeAuctionEvent())
    return
  }
  
  if (!socket || !socket.connected) {
    // Demo mode - start next player locally
    dispatch(startNextPlayer())
    return
  }
  
  socket.emit('start-next-player')
}

export default auctionSlice.reducer