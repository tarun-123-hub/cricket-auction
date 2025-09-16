import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gavel,
  Timer,
  DollarSign,
  Users,
  Send,
  TrendingUp,
  MessageCircle,
  ShieldCheck,
  ArrowRight,
  Crown,
  CheckCircle,
  XCircle,
  Play,
  Pause,
} from 'lucide-react';
import { placeBid, endAuctionAction, setAuctionState, startAuction, newBid, updateTimer, auctionEnded, startNextPlayerAction, completeAuctionEvent } from '../store/slices/auctionSlice';
import { sendMessage } from '../store/slices/socketSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmationModal from '../components/ConfirmationModal';
import EnhancedAuctionHammer from '../components/EnhancedAuctionHammer';
import TeamPurseDisplay from '../components/TeamPurseDisplay';
import PurchasedPlayersDisplay from '../components/PurchasedPlayersDisplay';
import toast from 'react-hot-toast';

const AuctionRoom = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth || {});
  const { socket, isConnected, messages } = useSelector((state) => state.socket || {});
  const {
    isActive,
    isEventComplete,
    currentPlayer,
    currentBid,
    baseBid,
    timer,
    bidders: bidHistory,
    lastResult,
    teams,
    soldPlayers,
    unsoldPlayers,
    remainingPlayers,
    auctionSummary,
  } = useSelector((state) => state.auction || {});

  const [bidAmount, setBidAmount] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showHammer, setShowHammer] = useState(false);
  const [hammerResult, setHammerResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll chat messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle auction completion and redirection
  useEffect(() => {
    if (isEventComplete && auctionSummary) {
      const timer = setTimeout(() => {
        if (user?.role === 'admin') {
          navigate('/auction-summary');
        } else if (user?.role === 'bidder') {
          navigate('/bidder-thank-you');
        } else {
          navigate('/auction-summary');
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isEventComplete, auctionSummary, user?.role, navigate]);

  useEffect(() => {
    if (!socket) return;

    const handleAuctionState = (state) => {
      dispatch(setAuctionState(state));
    };

    const handleAuctionStarted = (state) => {
      dispatch(startAuction(state));
      toast.success(`Auction started for ${state.currentPlayer?.name}`);
    };

    const handleAuctionEnded = (data) => {
      dispatch(auctionEnded(data));
      if (data.result.sold) {
        toast.success(`${data.player.name} sold to ${data.result.team} for ₹${data.result.price.toLocaleString()}`);
      } else {
        toast.error(`${data.player.name} went unsold`);
      }
    };

    const handleNewBid = (data) => {
      dispatch(newBid(data));
    };

    const handleTimerUpdate = (time) => {
      dispatch(updateTimer(time));
    };

    const handleBidError = (error) => {
      toast.error(error);
    };

    socket.on('auction-state', handleAuctionState);
    socket.on('auction-started', handleAuctionStarted);
    socket.on('auction-ended', handleAuctionEnded);
    socket.on('new-bid', handleNewBid);
    socket.on('timer-update', handleTimerUpdate);
    socket.on('bid-error', handleBidError);

    return () => {
      socket.off('auction-state', handleAuctionState);
      socket.off('auction-started', handleAuctionStarted);
      socket.off('auction-ended', handleAuctionEnded);
      socket.off('new-bid', handleNewBid);
      socket.off('timer-update', handleTimerUpdate);
      socket.off('bid-error', handleBidError);
    };
  }, [socket, dispatch]);

  useEffect(() => {
    if (lastResult) {
      setHammerResult(lastResult.sold ? 'sold' : 'unsold');
      setShowHammer(true);
      
      // Auto-start next player after hammer animation
      const nextPlayerTimer = setTimeout(() => {
        if (remainingPlayers.length > 0) {
          dispatch(startNextPlayerAction());
        } else {
          dispatch(completeAuctionEvent());
        }
      }, 4000); // Wait for hammer animation to complete
      
      return () => clearTimeout(nextPlayerTimer);
    }
  }, [lastResult, remainingPlayers.length, dispatch]);

  useEffect(() => {
    if (currentBid > 0) {
      setBidAmount(String(currentBid + 100000));
    }
  }, [currentBid]);

  const handlePlaceBid = (e) => {
    e.preventDefault();
    const amount = parseInt(String(bidAmount).replace(/[^0-9]/g, ''));
    if (isNaN(amount)) {
      toast.error('Invalid bid amount');
      return;
    }
    dispatch(placeBid(amount));
  };

  const handleAdminDecision = (sold) => {
    setConfirmAction({ type: sold ? 'sold' : 'unsold', sold });
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || !isActive) return;
    
    setIsProcessing(true);
    try {
      const winningTeam = confirmAction.sold && bidHistory.length > 0 
        ? bidHistory[bidHistory.length - 1].team 
        : null;
      
      dispatch(endAuctionAction({ 
        sold: confirmAction.sold,
        team: winningTeam
      }));
      setShowConfirmModal(false);
      setConfirmAction(null);
    } catch (error) {
      toast.error('Failed to process action');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHammerComplete = () => {
    setShowHammer(false);
    setHammerResult(null);
  };

  const handleEndAuctionEvent = () => {
    dispatch(completeAuctionEvent());
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      dispatch(sendMessage(chatMessage.trim()));
      setChatMessage('');
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  // Remove hammer animation and show simple sold/unsold message
  const showResultMessage = (result, playerName) => {
    const message = result === 'sold' ? 'SOLD!' : 'UNSOLD'
    const color = result === 'sold' ? 'text-green-400' : 'text-red-400'
    
    toast.success(
      <div className={`text-center ${color} font-bold text-lg`}>
        <div>{message}</div>
        <div className="text-white text-sm mt-1">{playerName}</div>
      </div>,
      { duration: 3000 }
    )
  }

  // Show completion message if auction is complete
  if (isEventComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-gray-800/90 backdrop-blur-xl rounded-2xl p-12 border border-blue-500/30"
        >
          <Trophy className="h-24 w-24 text-yellow-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">Auction Complete!</h1>
          <p className="text-lg text-gray-300 mb-6">
            All players have been auctioned. Redirecting to summary...
          </p>
          <div className="flex items-center justify-center space-x-4 text-base text-blue-400">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Preparing summary...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <LoadingSpinner size="large" />
        <p className="ml-4">Connecting to auction room...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 text-white p-4 lg:p-6 font-sans">
      <div className="grid grid-cols-12 gap-6 h-full">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <TeamPurseDisplay teams={teams} isActive={isActive} />
          
          <InfoCard title="Bidding History">
            <div className="h-96 overflow-y-auto space-y-3 pr-2">
              {bidHistory.slice().reverse().map((bid, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-between items-center bg-gray-800/70 backdrop-blur-sm p-3 rounded-lg border border-gray-700/50"
                >
                  <div>
                    <p className="font-semibold text-blue-300 text-base">{bid.team}</p>
                    <p className="text-sm text-gray-400">{new Date(bid.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <p className="font-bold text-neon-green text-base">{formatCurrency(bid.amount)}</p>
                </motion.div>
              ))}
            </div>
          </InfoCard>
        </div>

        {/* Center Column */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/50 aspect-video flex items-center justify-center relative overflow-hidden shadow-2xl">
            {isActive && currentPlayer ? (
              <>
                <img
                  src={currentPlayer.image || 'https://via.placeholder.com/400'}
                  alt={currentPlayer.name}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-xl"
                />
                {/* Simple result overlay instead of hammer animation */}
                {showHammer && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center"
                  >
                    <div className={`text-center p-8 rounded-xl border-4 ${
                      hammerResult === 'sold' 
                        ? 'bg-green-900/50 border-green-400 text-green-400' 
                        : 'bg-red-900/50 border-red-500 text-red-500'
                    }`}>
                      <div className="text-6xl font-bold mb-4">
                        {hammerResult === 'sold' ? 'SOLD!' : 'UNSOLD'}
                      </div>
                      <div className="text-xl text-white">{currentPlayer.name}</div>
                      {hammerResult === 'sold' && bidHistory.length > 0 && (
                        <>
                          <div className="text-lg text-yellow-400 mt-2">
                            {formatCurrency(currentBid)}
                          </div>
                          <div className="text-base text-blue-300">
                            to {bidHistory[bidHistory.length - 1].team}
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500">
                <Gavel size={80} className="mx-auto mb-6 text-gray-600" />
                <h2 className="text-2xl font-semibold">
                  {remainingPlayers.length > 0 ? 'Waiting for next auction...' : 'Auction Complete!'}
                </h2>
                {remainingPlayers.length > 0 && (
                  <p className="text-base text-gray-400 mt-4">
                    {remainingPlayers.length} players remaining
                  </p>
                )}
              </div>
            )}
          </div>
          
          {isActive && currentPlayer && (
            <PlayerInfoCard
              player={currentPlayer}
              basePrice={baseBid}
              currentBid={currentBid}
              timer={timer}
              onBid={handlePlaceBid}
              bidAmount={bidAmount}
              setBidAmount={setBidAmount}
              formatCurrency={formatCurrency}
              userRole={user?.role}
            />
          )}
          
          {isActive && currentPlayer && user?.role === 'admin' && (
            <AdminControls onAdminDecision={handleAdminDecision} isActive={isActive} />
          )}
          
          {/* End Auction Event Button (Admin Only) */}
          {user?.role === 'admin' && !isActive && remainingPlayers.length === 0 && soldPlayers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/50 shadow-xl text-center"
            >
              <h3 className="text-xl font-bold text-purple-400 mb-4">Auction Event Complete</h3>
              <p className="text-gray-300 mb-6">All players have been auctioned. Click below to view the summary.</p>
              <button
                onClick={handleEndAuctionEvent}
                className="btn-primary text-lg px-6 py-3"
              >
                View Auction Summary
              </button>
            </motion.div>
          )}
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <PurchasedPlayersDisplay teams={teams} isActive={isActive} />
          
          <InfoCard title="Live Chat">
            <div className="flex flex-col h-96">
              <div className="flex-grow overflow-y-auto mb-3 space-y-3 pr-2">
                {messages.map((msg, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/50 backdrop-blur-sm p-3 rounded-lg border border-gray-700/30"
                  >
                    <span className="font-semibold text-blue-300 text-sm">{msg.user}: </span>
                    <span className="text-gray-200 text-sm">{msg.message}</span>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="flex space-x-3">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="input-field flex-1"
                />
                <button type="submit" className="btn-primary p-3">
                  <Send size={16} />
                </button>
              </form>
            </div>
          </InfoCard>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
        }}
        onConfirm={handleConfirmAction}
        title={confirmAction?.type === 'sold' ? 'Mark Player as Sold' : 'Mark Player as Unsold'}
        message={
          confirmAction?.type === 'sold' 
            ? 'Are you sure you want to mark this player as SOLD? This action will finalize the auction for this player.'
            : 'Are you sure you want to mark this player as UNSOLD? This player will not be assigned to any team.'
        }
        type={confirmAction?.type === 'sold' ? 'success' : 'error'}
        confirmText={confirmAction?.type === 'sold' ? 'Mark as Sold' : 'Mark as Unsold'}
        playerName={currentPlayer?.name}
        currentBid={currentBid}
        isLoading={isProcessing}
      />
    </div>
  );
};

const InfoCard = ({ title, children }) => (
  <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30 h-full shadow-xl">
    <h2 className="text-lg font-bold text-blue-400 mb-4 flex items-center">
      <ShieldCheck size={20} className="mr-2 text-neon-green" />
      {title}
    </h2>
    {children}
  </div>
);

const PlayerInfoCard = ({ player, basePrice, currentBid, timer, onBid, bidAmount, setBidAmount, formatCurrency, userRole }) => {
  if (!player) return null;

  const timerColor = timer <= 10 ? 'text-red-500' : timer <= 20 ? 'text-yellow-400' : 'text-neon-green';

  return (
    <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/50 relative shadow-xl">
      <div className="absolute top-6 right-6 flex flex-col items-center">
        <motion.div 
          animate={{ 
            scale: timer <= 10 ? [1, 1.1, 1] : 1,
            boxShadow: timer <= 10 ? ['0 0 0 0 rgba(239, 68, 68, 0.7)', '0 0 0 10px rgba(239, 68, 68, 0)', '0 0 0 0 rgba(239, 68, 68, 0)'] : 'none'
          }}
          transition={{ 
            duration: 1,
            repeat: timer <= 10 ? Infinity : 0
          }}
          className={`text-4xl font-bold ${timerColor} bg-black/70 backdrop-blur-sm rounded-full w-20 h-20 flex items-center justify-center border-2 ${timerColor.replace('text-', 'border-')} shadow-xl`}
        >
          {timer}
        </motion.div>
        <Timer size={20} className={`mt-2 ${timerColor}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white mb-2">{player.name}</h2>
          <p className="text-lg text-gray-400 mb-4">{player.role} | {player.country}</p>
          <div className="flex space-x-6 mt-6 text-center">
            <div>
              <p className="text-sm text-gray-400">Age</p>
              <p className="text-lg font-semibold">{player.age || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Key Stats</p>
              <p className="text-lg font-semibold">{player.stats || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-blue-900/50 backdrop-blur-sm p-4 rounded-lg border border-blue-500/30">
            <p className="text-sm text-blue-300">Base Price</p>
            <p className="text-2xl font-bold">{formatCurrency(basePrice)}</p>
          </div>
          <div className="bg-green-900/50 backdrop-blur-sm p-4 rounded-lg border border-green-500/30">
            <p className="text-sm text-green-300">Current Bid</p>
            <p className="text-3xl font-bold">{formatCurrency(currentBid)}</p>
          </div>
        </div>
      </div>

      {userRole === 'bidder' && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <form onSubmit={onBid} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder="Enter bid amount"
              className="input-field flex-grow"
              inputMode="numeric"
            />
            <button type="submit" className="btn-primary flex-shrink-0 px-6 py-3">
              <Gavel size={20} className="mr-2" />
              Place Bid
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-3">
            {[100000, 500000, 1000000].map((inc) => (
              <button
                key={inc}
                onClick={() => setBidAmount(String(currentBid + inc))}
                className="btn-secondary px-3 py-2"
              >
                + {formatCurrency(inc)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AdminControls = ({ onAdminDecision, isActive }) => (
  <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/50 shadow-xl">
    <h3 className="text-lg font-bold text-blue-400 mb-4 text-center">Admin Controls</h3>
    <div className="flex justify-center space-x-6">
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onAdminDecision(true)} 
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg" 
        disabled={!isActive}
      >
        <CheckCircle size={20} />
        <span>Mark Sold</span>
      </motion.button>
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onAdminDecision(false)} 
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg" 
        disabled={!isActive}
      >
        <XCircle size={20} />
        <span>Mark Unsold</span>
      </motion.button>
    </div>
  </div>
);

export default AuctionRoom;