import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
} from 'lucide-react';
import { placeBid, endAuctionAction, setAuctionState, startAuction, newBid, updateTimer, auctionEnded } from '../store/slices/auctionSlice';
import { sendMessage } from '../store/slices/socketSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmationModal from '../components/ConfirmationModal';
import AuctionHammer from '../components/AuctionHammer';
import toast from 'react-hot-toast';

const AuctionRoom = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});
  const { socket, isConnected, messages } = useSelector((state) => state.socket || {});
  const {
    isActive,
    currentPlayer,
    currentBid,
    baseBid,
    timer,
    bidders: bidHistory,
    lastResult,
    teams,
    soldPlayers,
  } = useSelector((state) => state.auction || {});

  const [bidAmount, setBidAmount] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showHammer, setShowHammer] = useState(false);
  const [hammerResult, setHammerResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [activeInfoIndex, setActiveInfoIndex] = useState(0);

  const messagesEndRef = useRef(null);

  const bidders = Object.values(teams || {});
  const purchasedPlayers = soldPlayers || [];

  useEffect(() => {
    if (bidders.length > 0) {
      const interval = setInterval(() => {
        setActiveInfoIndex((prevIndex) => (prevIndex + 1) % bidders.length);
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [bidders.length]);

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
    }
  }, [lastResult]);

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
      dispatch(endAuctionAction({ sold: confirmAction.sold }));
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

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <LoadingSpinner size="large" />
        <p className="ml-4">Connecting to auction room...</p>
      </div>
    );
  }

  const activeBidder = bidders.length > 0 ? bidders[activeInfoIndex] : null;
  const purchasedPlayersByTeam = activeBidder ? purchasedPlayers.filter(p => p.soldTo === activeBidder.name) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 text-white p-6 lg:p-8 font-sans">
      <div className="grid grid-cols-12 gap-6 h-full">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <InfoCard title="Available Purse">
            <AnimatePresence mode="wait">
              {activeBidder && (
                <motion.div
                  key={activeBidder.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-2"
                >
                  <h3 className="text-3xl font-bold text-blue-400">{activeBidder.name}</h3>
                  <p className="text-5xl font-bold text-neon-green">{formatCurrency(activeBidder.purse)}</p>
                  <p className="text-xl text-gray-300">Players Purchased: {activeBidder.players.length}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </InfoCard>
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
                    <p className="font-semibold text-blue-300 text-lg">{bid.team}</p>
                    <p className="text-sm text-gray-400">{new Date(bid.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <p className="font-bold text-neon-green text-lg">{formatCurrency(bid.amount)}</p>
                </motion.div>
              ))}
            </div>
          </InfoCard>
        </div>

        {/* Center Column */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 border border-blue-500/50 aspect-video flex items-center justify-center relative overflow-hidden shadow-2xl">
            {isActive && currentPlayer ? (
              <>
                <img
                  src={currentPlayer.image || 'https://via.placeholder.com/400'}
                  alt={currentPlayer.name}
                  className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
                />
                <AuctionHammer 
                  isVisible={showHammer}
                  result={hammerResult}
                  onAnimationComplete={handleHammerComplete}
                />
              </>
            ) : (
              <div className="text-center text-gray-500">
                <Gavel size={80} className="mx-auto mb-6 text-gray-600" />
                <h2 className="text-3xl font-semibold">Waiting for next auction...</h2>
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
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <InfoCard title="Purchased Players">
            <AnimatePresence mode="wait">
              {activeBidder && (
                <motion.div
                  key={activeBidder.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  className="h-64 overflow-y-auto space-y-3 pr-2"
                >
                  <h3 className="text-2xl font-bold text-blue-400 mb-3">{activeBidder.name}</h3>
                  {purchasedPlayersByTeam.map((player) => (
                    <div key={player.id} className="flex justify-between items-center bg-gray-800/70 backdrop-blur-sm p-3 rounded-lg border border-gray-700/50">
                      <p className="font-semibold text-lg">{player.name}</p>
                      <p className="text-base text-neon-green font-bold">{formatCurrency(player.finalPrice)}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </InfoCard>
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
                    <span className="font-semibold text-blue-300 text-base">{msg.user}: </span>
                    <span className="text-gray-200 text-base">{msg.message}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="flex space-x-3">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="input-field flex-1 text-lg"
                />
                <button type="submit" className="btn-primary p-4">
                  <Send size={20} />
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
    <h2 className="text-2xl font-bold text-blue-400 mb-4 flex items-center">
      <ShieldCheck size={24} className="mr-3 text-neon-green" />
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
          className={`text-6xl font-bold ${timerColor} bg-black/70 backdrop-blur-sm rounded-full w-28 h-28 flex items-center justify-center border-3 ${timerColor.replace('text-', 'border-')} shadow-2xl`}
        >
          {timer}
        </motion.div>
        <Timer size={24} className={`mt-3 ${timerColor}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-5xl font-extrabold text-white mb-2">{player.name}</h2>
          <p className="text-xl text-gray-400 mb-4">{player.role} | {player.country}</p>
          <div className="flex space-x-6 mt-6 text-center">
            <div>
              <p className="text-base text-gray-400">Age</p>
              <p className="text-2xl font-semibold">{player.age || 'N/A'}</p>
            </div>
            <div>
              <p className="text-base text-gray-400">Key Stats</p>
              <p className="text-2xl font-semibold">{player.stats || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-blue-900/50 backdrop-blur-sm p-4 rounded-lg border border-blue-500/30">
            <p className="text-base text-blue-300">Base Price</p>
            <p className="text-3xl font-bold">{formatCurrency(basePrice)}</p>
          </div>
          <div className="bg-green-900/50 backdrop-blur-sm p-4 rounded-lg border border-green-500/30">
            <p className="text-base text-green-300">Current Bid</p>
            <p className="text-4xl font-bold">{formatCurrency(currentBid)}</p>
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
              className="input-field flex-grow text-xl"
              inputMode="numeric"
            />
            <button type="submit" className="btn-primary flex-shrink-0 text-xl px-8 py-4">
              <Gavel size={24} className="mr-3" />
              Place Bid
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-3">
            {[100000, 500000, 1000000].map((inc) => (
              <button
                key={inc}
                onClick={() => setBidAmount(String(currentBid + inc))}
                className="btn-secondary text-base px-4 py-2"
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
    <h3 className="text-2xl font-bold text-blue-400 mb-6 text-center">Admin Controls</h3>
    <div className="flex justify-center space-x-6">
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onAdminDecision(true)} 
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 flex items-center space-x-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg" 
        disabled={!isActive}
      >
        <CheckCircle size={24} />
        <span>Mark Sold</span>
      </motion.button>
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onAdminDecision(false)} 
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 flex items-center space-x-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg" 
        disabled={!isActive}
      >
        <XCircle size={24} />
        <span>Mark Unsold</span>
      </motion.button>
    </div>
  </div>
);

export default AuctionRoom;