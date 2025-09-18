import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, AlertCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import LoadingSpinner from '../components/LoadingSpinner';

const AuctionWaiting = () => {
  const navigate = useNavigate();
  const { socket } = useSelector((state) => state.socket);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Listen for auction start event
    if (socket) {
      socket.on('event:started', () => {
        // Redirect to auction room when event starts
        navigate('/auction-room');
      });

      return () => {
        socket.off('event:started');
      };
    }
  }, [socket, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex items-center justify-center mb-6">
            <Clock className="h-12 w-12 text-blue-400 mr-4" />
            <h1 className="text-2xl font-bold text-white">Waiting for Auction</h1>
          </div>
          
          <div className="flex justify-center mb-8">
            <LoadingSpinner size="large" />
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">
              Wait for the admin to start the auction
            </h2>
            <p className="text-gray-400">
              You've successfully registered for the auction. 
              The page will automatically redirect you when the auction begins.
            </p>
          </div>
          
          <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/20">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-300">
                Registered as: <span className="font-semibold text-blue-400">{user?.username || 'Bidder'}</span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuctionWaiting;