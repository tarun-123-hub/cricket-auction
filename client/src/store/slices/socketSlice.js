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

  try {
    const socket = io('http://localhost:5000', {
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
      }
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      dispatch(setConnected(false))
      toast.error('Failed to connect to auction room')
    })

    // Chat events
    socket.on('new-message', (message) => {
      dispatch(addMessage(message))
    })

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