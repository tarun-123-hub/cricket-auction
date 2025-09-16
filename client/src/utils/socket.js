import { io } from 'socket.io-client';

// Initialize socket connection
const socket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001', {
  autoConnect: false,
  withCredentials: true
});

export default socket;