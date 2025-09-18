import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import socket from '../utils/socket';
import AuctionControlTab from '../components/admin/AuctionControlTab';
import EventManagementTab from '../components/admin/EventManagementTab';
import TeamsTab from '../components/admin/TeamsTab';
import StatisticsTab from '../components/admin/StatisticsTab';
import { motion } from 'framer-motion';
import { Shield, Settings, Calendar, GanttChartSquare, BarChart3 } from 'lucide-react';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const auctionState = useSelector((state) => state.auction);
  const [activeTab, setActiveTab] = useState('control');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  const tabs = [
    { id: 'control', label: 'Auction Control', icon: Shield },
    { id: 'events', label: 'Event Management', icon: Calendar },
    { id: 'teams', label: 'Teams', icon: GanttChartSquare },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 text-white">
      {/* Sidebar */}
      <div className="fixed left-0 top-16 h-full w-64 bg-gray-800/90 backdrop-blur-xl border-r border-gray-700/50 z-40">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <Settings className="h-8 w-8 text-purple-400" />
            <div>
              <h2 className="text-xl font-cricket font-bold">Admin Panel</h2>
              <p className="text-gray-400 text-sm">Manage auctions</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 pt-16">
        {auctionState && auctionState.currentPlayer && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 m-6 border border-gray-700">
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
        <div className="p-6">
          <motion.div 
            key={activeTab} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3 }}
            className="min-h-screen"
          >
            {activeTab === 'control' && <AuctionControlTab />}
            {activeTab === 'events' && <EventManagementTab />}
            {activeTab === 'teams' && <TeamsTab />}
            {activeTab === 'statistics' && <StatisticsTab />}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;