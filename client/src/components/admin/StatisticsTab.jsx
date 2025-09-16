import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Trophy, 
  DollarSign,
  Target,
  Award,
  Activity
} from 'lucide-react';
import axios from '../../api/axios';
import toast from 'react-hot-toast';

const StatisticsTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/auction/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16 bg-gray-800/50 rounded-2xl border border-gray-700/50">
        <BarChart3 className="h-16 w-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">No Statistics Available</h3>
        <p className="text-gray-500">Statistics will appear once auctions are conducted</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Players',
      value: stats.totalPlayers,
      icon: Users,
      color: 'from-blue-600 to-blue-800',
      textColor: 'text-blue-300'
    },
    {
      title: 'Players Sold',
      value: stats.soldPlayers,
      icon: Trophy,
      color: 'from-green-600 to-green-800',
      textColor: 'text-green-300'
    },
    {
      title: 'Players Unsold',
      value: stats.unsoldPlayers,
      icon: Target,
      color: 'from-red-600 to-red-800',
      textColor: 'text-red-300'
    },
    {
      title: 'Total Value',
      value: formatCurrency(stats.totalValue),
      icon: DollarSign,
      color: 'from-yellow-600 to-yellow-800',
      textColor: 'text-yellow-300'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cricket font-bold text-white">Auction Statistics</h1>
          <p className="text-gray-400 mt-2">Overview of auction performance and metrics</p>
        </div>
        <button
          onClick={fetchStats}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-colors duration-200"
        >
          <Activity className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 border border-white/10 shadow-xl`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-white mt-2">{card.value}</p>
                </div>
                <Icon className="h-12 w-12 text-white/60" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Team Statistics */}
      {stats.teamStats && stats.teamStats.length > 0 && (
        <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Award className="h-6 w-6 mr-3 text-purple-500" />
            Team Performance
          </h2>
          
          <div className="space-y-4">
            {stats.teamStats.map((team, index) => (
              <motion.div
                key={team._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">#{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{team._id}</h3>
                      <p className="text-gray-400 text-sm">{team.players} players acquired</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(team.totalSpent)}
                    </p>
                    <p className="text-gray-400 text-sm">Total Investment</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Spending Progress</span>
                    <span>{((team.totalSpent / stats.totalValue) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(team.totalSpent / stats.totalValue) * 100}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Auction Efficiency */}
        <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
            Auction Efficiency
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Success Rate</span>
              <span className="text-green-400 font-bold">
                {stats.totalPlayers > 0 ? ((stats.soldPlayers / stats.totalPlayers) * 100).toFixed(1) : 0}%
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Average Sale Price</span>
              <span className="text-blue-400 font-bold">
                {stats.soldPlayers > 0 ? formatCurrency(stats.totalValue / stats.soldPlayers) : formatCurrency(0)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Pending Players</span>
              <span className="text-yellow-400 font-bold">
                {stats.pendingPlayers || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Market Summary */}
        <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
            Market Summary
          </h3>
          
          <div className="space-y-4">
            <div className="bg-green-900/30 rounded-lg p-3 border border-green-500/20">
              <div className="flex justify-between items-center">
                <span className="text-green-300 text-sm">Total Revenue</span>
                <span className="text-white font-bold">{formatCurrency(stats.totalValue)}</span>
              </div>
            </div>
            
            <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-500/20">
              <div className="flex justify-between items-center">
                <span className="text-blue-300 text-sm">Active Teams</span>
                <span className="text-white font-bold">{stats.teamStats?.length || 0}</span>
              </div>
            </div>
            
            <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-500/20">
              <div className="flex justify-between items-center">
                <span className="text-purple-300 text-sm">Market Activity</span>
                <span className="text-white font-bold">
                  {stats.soldPlayers > 0 ? 'High' : 'Low'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsTab;