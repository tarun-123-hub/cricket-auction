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
} from 'lucide-react';
import { placeBid, endAuctionAction, setAuctionState, startAuction, newBid, updateTimer, auctionEnded } from '../store/slices/auctionSlice';
import { sendMessage } from '../store/slices/socketSlice';
import LoadingSpinner from '../components/LoadingSpinner';
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
  const [showHammer, setShowHammer] = useState(false);
  const [soldStatus, setSoldStatus] = useState(null); // 'sold' or 'unsold'

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
      setSoldStatus(lastResult.sold ? 'sold' : 'unsold');
      setShowHammer(true);
      setTimeout(() => {
        setShowHammer(false);
        setSoldStatus(null);
      }, 4000);
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
    if (isActive) {
      dispatch(endAuctionAction({ sold }));
    }
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
    <div className="min-h-screen bg-black text-white p-4 lg:p-6 font-sans">
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
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
                  <h3 className="text-2xl font-bold text-blue-400">{activeBidder.name}</h3>
                  <p className="text-4xl font-bold text-neon-green">{formatCurrency(activeBidder.purse)}</p>
                  <p className="text-lg text-gray-300">Players Purchased: {activeBidder.players.length}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </InfoCard>
          <InfoCard title="Bidding History">
            <div className="h-96 overflow-y-auto space-y-2 pr-2">
              {bidHistory.slice().reverse().map((bid, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-800 p-2 rounded-lg">
                  <div>
                    <p className="font-semibold text-blue-300">{bid.team}</p>
                    <p className="text-xs text-gray-400">{new Date(bid.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <p className="font-bold text-neon-green">{formatCurrency(bid.amount)}</p>
                </div>
              ))}
            </div>
          </InfoCard>
        </div>

        {/* Center Column */}
        <div className="col-span-12 lg:col-span-6 space-y-4">
          <div className="bg-gray-900 rounded-2xl p-4 border border-blue-500/50 aspect-video flex items-center justify-center relative overflow-hidden">
            {isActive && currentPlayer ? (
              <>
                <img
                  src={currentPlayer.image || 'https://via.placeholder.com/400'}
                  alt={currentPlayer.name}
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
                <AnimatePresence>
                  {showHammer && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center"
                    >
                      <motion.div
                        initial={{ y: -200, rotate: -45 }}
                        animate={{ y: 0, rotate: [0, -45, 0] }}
                        transition={{
                          rotate: {
                            duration: 0.5,
                            ease: "easeInOut",
                            times: [0, 0.5, 1],
                            repeat: 1,
                            repeatDelay: 0.5,
                          },
                          default: {
                            type: 'spring',
                            stiffness: 100,
                            damping: 10,
                            delay: 0.2,
                          },
                        }}
                      >
                        <Gavel className="h-48 w-48 text-yellow-400" />
                      </motion.div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8, duration: 0.3 }}
                        className={`mt-8 text-7xl font-extrabold tracking-wider border-4 p-4 rounded-xl ${
                          soldStatus === 'sold'
                            ? 'text-green-400 border-green-400'
                            : 'text-red-500 border-red-500'
                        }`}
                      >
                        {soldStatus === 'sold' ? 'SOLD' : 'UNSOLD'}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="text-center text-gray-500">
                <Gavel size={64} className="mx-auto mb-4" />
                <h2 className="text-2xl">Waiting for next auction...</h2>
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
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <InfoCard title="Purchased Players">
            <AnimatePresence mode="wait">
              {activeBidder && (
                <motion.div
                  key={activeBidder.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  className="h-64 overflow-y-auto space-y-2 pr-2"
                >
                  <h3 className="text-xl font-bold text-blue-400 mb-2">{activeBidder.name}</h3>
                  {purchasedPlayersByTeam.map((player) => (
                    <div key={player.id} className="flex justify-between items-center bg-gray-800 p-2 rounded-lg">
                      <p className="font-semibold">{player.name}</p>
                      <p className="text-sm text-neon-green">{formatCurrency(player.finalPrice)}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </InfoCard>
          <InfoCard title="Live Chat">
            <div className="flex flex-col h-96">
              <div className="flex-grow overflow-y-auto mb-2 space-y-2 pr-2">
                {messages.map((msg, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-semibold text-blue-300">{msg.user}: </span>
                    <span className="text-gray-200">{msg.message}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="input-field flex-1"
                />
                <button type="submit" className="btn-primary p-3">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </InfoCard>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ title, children }) => (
  <div className="bg-gray-900 rounded-2xl p-4 border border-blue-500/30 h-full">
    <h2 className="text-xl font-bold text-blue-400 mb-3 flex items-center">
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
    <div className="bg-gray-900 rounded-2xl p-4 border border-blue-500/50 relative">
      <div className="absolute top-4 right-4 flex flex-col items-center">
        <div className={`text-5xl font-bold ${timerColor} bg-black/50 rounded-full w-24 h-24 flex items-center justify-center border-2 ${timerColor.replace('text-', 'border-')}`}>
          {timer}
        </div>
        <Timer size={20} className={`mt-2 ${timerColor}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-white">{player.name}</h2>
          <p className="text-lg text-gray-400">{player.role} | {player.country}</p>
          <div className="flex space-x-4 mt-4 text-center">
            <div>
              <p className="text-sm text-gray-400">Age</p>
              <p className="text-xl font-semibold">{player.age || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Key Stats</p>
              <p className="text-xl font-semibold">{player.stats || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-blue-900/50 p-3 rounded-lg">
            <p className="text-sm text-blue-300">Base Price</p>
            <p className="text-2xl font-bold">{formatCurrency(basePrice)}</p>
          </div>
          <div className="bg-green-900/50 p-3 rounded-lg">
            <p className="text-sm text-green-300">Current Bid</p>
            <p className="text-3xl font-bold">{formatCurrency(currentBid)}</p>
          </div>
        </div>
      </div>

      {userRole === 'bidder' && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <form onSubmit={onBid} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder="Enter bid amount"
              className="input-field flex-grow text-lg"
              inputMode="numeric"
            />
            <button type="submit" className="btn-primary flex-shrink-0 text-lg">
              <Gavel size={20} className="mr-2" />
              Place Bid
            </button>
          </form>
          <div className="mt-2 flex flex-wrap gap-2">
            {[100000, 500000, 1000000].map((inc) => (
              <button
                key={inc}
                onClick={() => setBidAmount(String(currentBid + inc))}
                className="btn-secondary text-xs"
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
  <div className="bg-gray-900 rounded-2xl p-4 border border-blue-500/50 flex justify-around items-center">
    <h3 className="text-lg font-bold text-blue-400">Admin Controls</h3>
    <button onClick={() => onAdminDecision(true)} className="btn-primary" disabled={!isActive}>Mark Sold</button>
    <button onClick={() => onAdminDecision(false)} className="btn-secondary" disabled={!isActive}>Mark Unsold</button>
  </div>
);

export default AuctionRoom;