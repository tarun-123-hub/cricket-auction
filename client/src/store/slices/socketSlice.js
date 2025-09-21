import { createSlice } from '@reduxjs/toolkit'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'

const socketSlice = createSlice({
  name: 'socket',
  initialState: {
    socket: null,
    isConnected: false,
    messages: [],
    onlineUsers: [],
  },
  reducers: {
    setSocket: (state, action) => {
      state.socket = action.payload
    },
    setConnected: (state, action) => {
      state.isConnected = action.payload
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload)
      // Keep only last 100 messages
      if (state.messages.length > 100) {
        state.messages = state.messages.slice(-100)
      }
    },
    clearMessages: (state) => {
      state.messages = []
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload
    },
    disconnect: (state) => {
      if (state.socket) {
        state.socket.disconnect()
      }
      state.socket = null
      state.isConnected = false
      state.messages = []
      state.onlineUsers = []
    },
  },
})

export const {
  setSocket,
  setConnected,
  addMessage,
  clearMessages,
  setOnlineUsers,
  disconnect,
} = socketSlice.actions

// Thunk for initializing socket connection
export const initializeSocket = () => (dispatch, getState) => {
  const { auth } = getState()
  
  if (!auth.token || !auth.user) {
    console.error('Cannot initialize socket: No auth token or user')
    return
  }

  // Demo mode: stub a socket connection when using local demo login
  const isDemo = typeof auth.token === 'string' && auth.token.startsWith('local_dev_token')
  if (isDemo) {
    try {
      // Keep handlers in closure so Redux freezing doesn't block updates
      const handlers = {}
      const mockSocket = {
        connected: true,
        on: (event, cb) => { handlers[event] = cb },
        off: (event) => { delete handlers[event] },
        emit: (event, payload) => {
          // Minimal event routing for demo
          if (event === 'send-message') {
            const message = {
              user: auth.user?.username || 'user',
              role: auth.user?.role || 'spectator',
              message: payload?.text || '',
              timestamp: Date.now(),
            }
            handlers['new-message'] && handlers['new-message'](message)
            return
          }
          if (event === 'bidder:join-auction') {
            // Simulate successful join in demo mode
            setTimeout(() => {
              handlers['join:success'] && handlers['join:success']({ eventId: payload?.eventId })
            }, 100)
            return
          }
          if (event === 'start-auction-event') {
            // Simulate auction start in demo mode
            setTimeout(() => {
              handlers['auction:started'] && handlers['auction:started']({ 
                eventId: payload?.eventId,
                auctionState: { isActive: true, currentPlayer: null }
              })
            }, 100)
            return
          }
          handlers[event] && handlers[event](payload)
        },
        disconnect: () => {},
      }
      dispatch(setSocket(mockSocket))
      dispatch(setConnected(true))
      toast.success('Connected (demo mode)')
      return mockSocket
    } catch (e) {
      console.error('Demo socket init error', e)
      dispatch(setConnected(true))
    }
  }

  try {
    const socket = io('http://localhost:5001', {
      auth: {
        token: auth.token
      },
      transports: ['websocket', 'polling']
    })

    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      dispatch(setConnected(true))
      toast.success('Connected to auction room')
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      dispatch(setConnected(false))
      if (reason !== 'io client disconnect') {
        toast.error('Disconnected from auction room')
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (!socket.connected) {
            socket.connect()
          }
        }, 2000)
      }
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      dispatch(setConnected(false))
      toast.error('Failed to connect to auction room')
      // Retry connection after a delay
      setTimeout(() => {
        socket.connect()
      }, 3000)
    })

    // Chat events
    socket.on('new-message', (message) => {
      dispatch(addMessage(message))
    })

    // Event announcements
    socket.on('event:activated', (payload) => {
      const name = payload?.event?.eventName || payload?.eventName || 'Auction Event'
      toast.success(`Live Event: ${name}`)
    })

    // Team approval notifications
    socket.on('team:approved', (payload) => {
      toast.success('Your team has been approved! You can now join the auction.')
    })

    // Auction started notifications
    socket.on('auction:started', (payload) => {
      toast.success('Auction has started!')
    })

    // Mirror: update redux auction state minimal without importing store slice here
    // This keeps the toast and leaves state syncing to existing listeners

    // Store socket instance
    dispatch(setSocket(socket))

    return socket
  } catch (error) {
    console.error('Error initializing socket:', error)
    toast.error('Failed to initialize connection')
  }
}

// Thunk for sending messages
export const sendMessage = (message) => (dispatch, getState) => {
  const { socket } = getState().socket
  
  if (socket && socket.connected) {
    socket.emit('send-message', { text: message })
  } else {
    toast.error('Not connected to chat')
  }
}

export default socketSlice.reducer