import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import toast from 'react-hot-toast'

// Configure axios defaults - use Vite proxy (/api -> server) to avoid port mismatches
axios.defaults.baseURL = '/api'
axios.defaults.withCredentials = true; // Send cookies with requests

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/login', { username, password })
      toast.success('Login successful!')
      return response.data
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return rejectWithValue(message)
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/register', userData)
      toast.success('Registration successful!')
      return response.data
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      return rejectWithValue(message)
    }
  }
)

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/auth/me')
      return response.data
    } catch (error) {
      return rejectWithValue('Not authenticated')
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { dispatch }) => {
    try {
      await axios.post('/auth/logout')
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout API error:', error)
    }
  }
)

// Helpers for demo/local storage persistence
const STORAGE_KEY = 'demo_auth_state'
const getStoredAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (_) {
    return null
  }
}

const stored = getStoredAuth()

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: stored?.user || null,
    isAuthenticated: stored?.isAuthenticated || false,
    isLoading: false,
    token: stored?.token || null,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
    },
    // Simple local login to bypass server auth
    localLogin: (state, action) => {
      const { username, password } = action.payload || {}
      const demoUsers = {
        admin: { password: 'admin123', role: 'admin', id: '507f1f77bcf86cd799439011' },
        bidder: { password: 'bidder123', role: 'bidder', id: '507f1f77bcf86cd799439012' },
        spectator: { password: 'spectator123', role: 'spectator', id: '507f1f77bcf86cd799439013' },
      }

      const found = demoUsers[username?.trim()?.toLowerCase?.()] || null

      if (!found || found.password !== password) {
        state.isAuthenticated = false
        state.user = null
        state.token = null
        state.isLoading = false
        state.error = 'Invalid username or password'
        return
      }

      state.isAuthenticated = true
      state.user = { username, role: found.role, id: found.id }
      state.token = `local_dev_token_${found.role}`
      state.isLoading = false
      state.error = null

      // Persist demo auth
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          isAuthenticated: true,
          user: state.user,
          token: state.token,
        }))
      } catch (_) {}
    },
    localLogout: (state) => {
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.error = null
      try { localStorage.removeItem(STORAGE_KEY) } catch (_) {}
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.user = null
        state.error = action.payload
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.error = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.user = null
        state.error = action.payload
      })
      
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.error = null
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.user = null
        state.error = null
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false
        state.user = null
        state.error = null
      })
  },
})

export const { clearError, updateUser, localLogin, localLogout } = authSlice.actions
export default authSlice.reducer