import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from '../../api/axios'
import toast from 'react-hot-toast'

export const fetchAuctionEvents = createAsyncThunk(
  'auctionEvents/fetchAuctionEvents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/auction-event/all')
      return response.data
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch auction events'
      return rejectWithValue(message)
    }
  }
)

export const createAuctionEvent = createAsyncThunk(
  'auctionEvents/createAuctionEvent',
  async (eventData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auction-event', eventData)
      toast.success('Auction event created successfully!')
      return response.data.event
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create auction event'
      toast.error(message)
      return rejectWithValue(message)
    }
  }
)

export const updateBidderPurse = createAsyncThunk(
  'auctionEvents/updateBidderPurse',
  async ({ bidderId, purse }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/auction-event/bidder/${bidderId}/purse`, { purse });
      toast.success('Purse updated successfully!');
      return response.data.bidder;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update purse';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const auctionEventSlice = createSlice({
  name: 'auctionEvents',
  initialState: {
    events: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuctionEvents.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAuctionEvents.fulfilled, (state, action) => {
        state.loading = false
        state.events = action.payload
      })
      .addCase(fetchAuctionEvents.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createAuctionEvent.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createAuctionEvent.fulfilled, (state, action) => {
        state.loading = false
        state.events.push(action.payload)
      })
      .addCase(createAuctionEvent.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateBidderPurse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBidderPurse.fulfilled, (state, action) => {
        state.loading = false;
        const event = state.events.find(event => event.isLive);
        if (event) {
          const bidder = event.registeredBidders.find(bidder => bidder._id === action.payload._id);
          if (bidder) {
            bidder.purse = action.payload.purse;
          }
        }
      })
      .addCase(updateBidderPurse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
})

export default auctionEventSlice.reducer
