import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from '../../api/axios'
import toast from 'react-hot-toast'

// Async thunks
export const fetchPlayers = createAsyncThunk(
  'players/fetchPlayers',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams(filters).toString()
      const response = await axios.get(`/players?${params}`)
      return response.data
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch players'
      return rejectWithValue(message)
    }
  }
)

export const createPlayer = createAsyncThunk(
  'players/createPlayer',
  async (playerData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/players', playerData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      toast.success('Player created successfully!')
      return response.data.player
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create player'
      toast.error(message)
      return rejectWithValue(message)
    }
  }
)

export const updatePlayer = createAsyncThunk(
  'players/updatePlayer',
  async ({ id, playerData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/players/${id}`, playerData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success('Player updated successfully!');
      return response.data.player;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update player';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deletePlayer = createAsyncThunk(
  'players/deletePlayer',
  async (playerId, { rejectWithValue }) => {
    try {
      await axios.delete(`/players/${playerId}`)
      toast.success('Player deleted successfully!')
      return playerId
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete player'
      toast.error(message)
      return rejectWithValue(message)
    }
  }
)

export const updateAuctionStatus = createAsyncThunk(
  'players/updateAuctionStatus',
  async ({ playerId, status, soldTo, finalPrice }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/players/${playerId}/auction-status`, {
        status,
        soldTo,
        finalPrice,
      })
      
      return response.data.player
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update auction status'
      return rejectWithValue(message)
    }
  }
)

const playersSlice = createSlice({
  name: 'players',
  initialState: {
    players: [],
    selectedPlayer: null,
    isLoading: false,
    error: null,
    filters: {
      status: '',
      role: '',
      country: '',
    },
  },
  reducers: {
    setSelectedPlayer: (state, action) => {
      state.selectedPlayer = action.payload
    },
    clearSelectedPlayer: (state) => {
      state.selectedPlayer = null
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearError: (state) => {
      state.error = null
    },
    updatePlayerInList: (state, action) => {
      const index = state.players.findIndex(p => p._id === action.payload._id)
      if (index !== -1) {
        state.players[index] = action.payload
      }
    },
    // Demo mode: add/delete players locally without server
    addPlayerLocal: (state, action) => {
      const player = {
        _id: `local_${Date.now()}`,
        name: action.payload.name,
        role: action.payload.role || 'Batsman',
        basePrice: Number(action.payload.basePrice) || 0,
        country: action.payload.country || 'India',
        stats: action.payload.stats || '',
        image: action.payload.image || null, // data URL for preview in demo mode
      }
      state.players.unshift(player)
    },
    deletePlayerLocal: (state, action) => {
      state.players = state.players.filter(p => p._id !== action.payload)
      if (state.selectedPlayer?._id === action.payload) {
        state.selectedPlayer = null
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Players
      .addCase(fetchPlayers.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchPlayers.fulfilled, (state, action) => {
        state.isLoading = false
        state.players = action.payload
        state.error = null
      })
      .addCase(fetchPlayers.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
      // Create Player
      .addCase(createPlayer.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createPlayer.fulfilled, (state, action) => {
        state.isLoading = false
        state.players.unshift(action.payload)
        state.error = null
      })
      .addCase(createPlayer.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
      // Update Player
      .addCase(updatePlayer.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updatePlayer.fulfilled, (state, action) => {
        state.isLoading = false
        const index = state.players.findIndex(p => p._id === action.payload._id)
        if (index !== -1) {
          state.players[index] = action.payload
        }
        if (state.selectedPlayer?._id === action.payload._id) {
          state.selectedPlayer = action.payload
        }
        state.error = null
      })
      .addCase(updatePlayer.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
      // Delete Player
      .addCase(deletePlayer.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(deletePlayer.fulfilled, (state, action) => {
        state.isLoading = false
        state.players = state.players.filter(p => p._id !== action.payload)
        if (state.selectedPlayer?._id === action.payload) {
          state.selectedPlayer = null
        }
        state.error = null
      })
      .addCase(deletePlayer.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
      // Update Auction Status
      .addCase(updateAuctionStatus.fulfilled, (state, action) => {
        const index = state.players.findIndex(p => p._id === action.payload._id)
        if (index !== -1) {
          state.players[index] = action.payload
        }
      })
  },
})

export const {
  setSelectedPlayer,
  clearSelectedPlayer,
  setFilters,
  clearError,
  updatePlayerInList,
  addPlayerLocal,
  deletePlayerLocal,
} = playersSlice.actions

export default playersSlice.reducer