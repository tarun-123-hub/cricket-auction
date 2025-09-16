import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import socket from '../utils/socket';
import PlayerList from '../components/PlayerList';
import AuctionControls from '../components/AuctionControls';
import TeamList from '../components/TeamList';
import AuctionEventForm from '../components/AuctionEventForm';
import { motion } from 'framer-motion';
import { Shield, Settings, Users, Calendar, GanttChartSquare } from 'lucide-react';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [auctionState, setAuctionState] = useState({
    isActive: false,
    isEventLive: false,
    isEventComplete: false,
    eventName: '',
    eventDescription: '',
    maxPlayers: 0,
    maxBidders: 8,
    eventPlayers: [],
    registeredBidders: [],
    currentPlayer: null,
    currentBid: 0,
    baseBid: 0,
    bidders: [],
    timer: 60,
    soldPlayers: [],
    unsoldPlayers: [],
    remainingPlayers: [],
    teams: {},
    currentPlayerIndex: 0
  });
  const [activeTab, setActiveTab] = useState('auction');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    socket.on('auction-state', (state) => {
      setAuctionState(state);
    });

    socket.on('auction-event-complete', (data) => {
      toast.success(`Auction event "${data.eventName}" completed!`);
      setAuctionState(prev => ({
        ...prev,
        isEventComplete: true,
        isActive: false
      }));
    });

    return () => {
      socket.off('auction-state');
      socket.off('auction-event-complete');
    };
  }, [user, navigate]);

  const handleStartAuction = (playerData) => {
    socket.emit('start-auction', playerData);
  };

  const handleStartNextPlayer = () => {
    socket.emit('start-next-player');
  };

  const handleEndAuction = (result) => {
    socket.emit('end-auction', result);
  };

  const handleActivateEvent = () => {
    socket.emit('activate-event');
  };

  const tabs = [
    { id: 'auction', label: 'Auction Control', icon: Shield },
    { id: 'event', label: 'Event Management', icon: Calendar },
    { id: 'players', label: 'Players', icon: Users },
    { id: 'teams', label: 'Teams', icon: GanttChartSquare },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center space-x-3 mb-8">
            <Settings className="h-10 w-10 text-purple-400" />
            <div>
              <h1 className="text-3xl font-cricket font-bold">Admin Panel</h1>
              <p className="text-gray-400">Manage auction events and players</p>
            </div>
          </div>
        </motion.div>

        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden mb-8">
          <div className="border-b border-gray-700">
            <nav className="flex -mb-px space-x-1 sm:space-x-4 px-4 sm:px-6">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`py-4 px-3 sm:px-6 text-center border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-400'
                        : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="p-6">
              {activeTab === 'auction' && (
                <AuctionControls
                  auctionState={auctionState}
                  onStartAuction={handleStartAuction}
                  onStartNextPlayer={handleStartNextPlayer}
                  onEndAuction={handleEndAuction}
                  onActivateEvent={handleActivateEvent}
                />
              )}

              {activeTab === 'event' && <AuctionEventForm />}
              {activeTab === 'players' && <PlayerList isAdmin={true} />}
              {activeTab === 'teams' && <TeamList registeredBidders={auctionState.registeredBidders} />}
            </div>
          </motion.div>
        </div>

        {auctionState.currentPlayer && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-8 border border-gray-700">
              <h2 className="text-xl font-bold mb-4 text-yellow-400">Current Player on the Block</h2>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-yellow-500">
                  {auctionState.currentPlayer.image ? (
                    <img 
                      src={`http://localhost:5001/uploads/players/${auctionState.currentPlayer.image}`} 
                      alt={auctionState.currentPlayer.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-3xl font-bold">{auctionState.currentPlayer.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{auctionState.currentPlayer.name}</h3>
                  <p className="text-gray-400">{auctionState.currentPlayer.category} • {auctionState.currentPlayer.specialty}</p>
                  <p className="text-lg font-semibold text-green-400">Base Price: ₹{auctionState.currentPlayer.basePrice}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
