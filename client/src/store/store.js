import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import socketSlice from './slices/socketSlice'
import auctionSlice from './slices/auctionSlice'
import playersSlice from './slices/playersSlice'
import auctionEventSlice from './slices/auctionEventSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    socket: socketSlice,
    auction: auctionSlice,
    players: playersSlice,
    auctionEvents: auctionEventSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['socket/setSocket'],
        ignoredPaths: ['socket.socket'],
      },
    }),
})