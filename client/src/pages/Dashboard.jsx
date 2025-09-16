import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Gavel, 
  Users, 
  Trophy, 
  BarChart3, 
  Settings, 
  Play,
  Clock,
  DollarSign,
  TrendingUp,
  Activity,
  UserPlus,
  CheckCircle
} from 'lucide-react'
import axios from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import BidderRegistrationModal from '../components/BidderRegistrationModal'

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const { isConnected } = useSelector((state) => state.socket)
  const { isActive, currentPlayer, soldPlayers, unsoldPlayers } = useSelector((state) => state.auction)
  
  const [stats, setStats] = useState(null)
  const [liveEvent, setLiveEvent] = useState(null)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [userRegistration, setUserRegistration] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchLiveEvent()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await axios.get('/auction-event/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLiveEvent = async () => {
    try {
      const response = await axios.get('/auction-event/live')
      setLiveEvent(response.data)
      
      // Check if current user is registered
      if (response.data && user) {
        const registration = response.data.registeredBidders.find(
          bidder => bidder.userId._id === user.id || bidder.userId === user.id
        )
        setUserRegistration(registration)
      }
    } catch (error) {
      console.error('Error fetching live event:', error)
    }
  }

  const handleRegistrationSuccess = () => {
    setShowRegistrationModal(false)
    fetchLiveEvent()
  }
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-600'
      case 'bidder': return 'bg-blue-600'
      case 'spectator': return 'bg-green-600'
      default: return 'bg-gray-600'
    }
  }

  const quickActions = [
    {
      title: 'Join Auction Room',
      description: 'Participate in live auctions',
      icon: Gavel,
      link: '/auction',
      color: 'bg-gradient-to-r from-blue-600 to-purple-600',
      available: user?.role === 'admin' || user?.role === 'spectator' || (user?.role === 'bidder' && userRegistration && userRegistration.purse > 0)
    },
    {
      title: 'View Statistics',
      description: 'Auction analytics and insights',
      icon: BarChart3,
      link: '/stats',
      color: 'bg-gradient-to-r from-green-600 to-teal-600',
      available: true
    },
    {
      title: 'Admin Panel',
      description: 'Manage auctions and players',
      icon: Settings,
      link: '/admin',
      color: 'bg-gradient-to-r from-purple-600 to-pink-600',
      available: user?.role === 'admin'
    },
    {
      title: 'Player Management',
      description: 'Add and edit players',
      icon: Users,
      link: '/admin/players',
      color: 'bg-gradient-to-r from-orange-600 to-red-600',
      available: user?.role === 'admin'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-cricket font-bold text-white mb-2">
                Welcome back, {user?.username}!
              </h1>
              <p className="text-gray-400 text-base">
                Ready for some cricket auction action?
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-full text-white text-sm font-semibold ${getRoleColor(user?.role)} shadow-lg`}>
                {user?.role?.toUpperCase()}
              </div>
              {user?.team && (
                <div className="px-4 py-2 rounded-full bg-gray-700 text-white text-sm font-semibold shadow-lg">
                  {user.team}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Event Status */}
        {liveEvent && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-xl shadow-xl border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                    <Play className="h-5 w-5 mr-2" />
                    Live Auction Event
                  </h3>
                  <p className="text-blue-100 text-sm mb-1">{liveEvent.eventName}</p>
                  <p className="text-blue-200 text-sm">
                    {liveEvent.registeredBidders.length}/{liveEvent.maxBidders} bidders registered
                  </p>
                </div>
                <div className="text-right">
                  {user?.role === 'bidder' && !userRegistration && (
                    <button
                      onClick={() => setShowRegistrationModal(true)}
                      className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors duration-200 text-sm shadow-lg flex items-center space-x-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Register for Auction</span>
                    </button>
                  )}
                  {user?.role === 'bidder' && userRegistration && (
                    <div className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold text-sm shadow-lg flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Registered as {userRegistration.teamName}</span>
                    </div>
                  )}
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors duration-200 text-sm shadow-lg"
                    >
                      Manage Event
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Bidder Registration Status */}
        {user?.role === 'bidder' && userRegistration && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 rounded-xl shadow-xl border border-green-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Registration Successful! 🎉</h3>
                  <p className="text-green-100 text-sm mb-1">Team Name: {userRegistration.teamName}</p>
                  <p className="text-green-100 text-sm mb-1">Owner: {userRegistration.ownerName}</p>
                  {userRegistration.purse > 0 ? (
                    <p className="text-green-100 text-sm">Purse: {formatCurrency(userRegistration.purse)}</p>
                  ) : (
                    <p className="text-yellow-200 text-sm">Waiting for admin to allocate purse...</p>
                  )}
                </div>
                {userRegistration.teamImage && (
                  <img
                    src={userRegistration.teamImage}
                    alt={userRegistration.teamName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
        {/* Connection Status */}
        <div className="mb-8">
          <div className={`p-6 rounded-xl border ${
            isConnected 
              ? 'bg-green-900/30 border-green-500 text-green-200' 
              : 'bg-red-900/30 border-red-500 text-red-200'
          } backdrop-blur-sm shadow-lg`}>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-semibold text-base">
                {isConnected ? 'Connected to Auction Room' : 'Disconnected from Auction Room'}
              </span>
            </div>
            <p className="text-sm mt-2 opacity-80">
              {isConnected 
                ? 'You can participate in live auctions and receive real-time updates.'
                : 'Please check your internet connection. Some features may be limited.'
              }
            </p>
          </div>
        </div>

        {/* Current Auction Status */}
        {isActive && currentPlayer && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6 rounded-xl shadow-xl border border-yellow-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                    <Play className="h-5 w-5 mr-2" />
                    Live Auction in Progress
                  </h3>
                  <p className="text-yellow-100 text-base">
                    {currentPlayer.name} is currently being auctioned
                  </p>
                </div>
                <Link
                  to="/auction"
                  className="bg-white text-orange-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors duration-200 text-base shadow-lg"
                >
                  Join Now
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Players</p>
                  <p className="text-3xl font-bold text-white">{stats.totalPlayers}</p>
                </div>
                <Users className="h-12 w-12 text-blue-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Players Sold</p>
                  <p className="text-3xl font-bold text-green-400">{stats.soldPlayers}</p>
                </div>
                <Trophy className="h-12 w-12 text-green-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Value</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {formatCurrency(stats.totalValue)}
                  </p>
                </div>
                <DollarSign className="h-12 w-12 text-yellow-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Auction Status</p>
                  <p className="text-xl font-bold text-white">
                    {isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <Activity className={`h-12 w-12 ${isActive ? 'text-green-500' : 'text-gray-500'}`} />
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-cricket font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.filter(action => action.available).map((action, index) => {
              const Icon = action.icon
              return (
                <Link
                  key={index}
                  to={action.link}
                  className="group block"
                >
                  <div className={`${action.color} p-6 rounded-xl shadow-xl transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl border border-white/10`}>
                    <Icon className="h-10 w-10 text-white mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">
                      {action.title}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {action.description}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recently Sold Players */}
          <div className="card">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-green-500" />
              Recently Sold Players
            </h3>
            {soldPlayers.length > 0 ? (
              <div className="space-y-4">
                {soldPlayers.slice(-5).reverse().map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-700/70 backdrop-blur-sm rounded-lg border border-gray-600/30">
                    <div>
                      <p className="font-semibold text-white text-base">{player.name}</p>
                      <p className="text-sm text-gray-400">{player.soldTo}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400 text-base">
                        {formatCurrency(player.finalPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8 text-base">No players sold yet</p>
            )}
          </div>

          {/* Team Statistics */}
          <div className="card">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
              Team Spending
            </h3>
            {stats?.teamStats && stats.teamStats.length > 0 ? (
              <div className="space-y-4">
                {stats.teamStats.slice(0, 5).map((team, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-700/70 backdrop-blur-sm rounded-lg border border-gray-600/30">
                    <div>
                      <p className="font-semibold text-white text-base">{team._id}</p>
                      <p className="text-sm text-gray-400">{team.players} players</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-400 text-base">
                        {formatCurrency(team.totalSpent)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8 text-base">No team data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Bidder Registration Modal */}
      <BidderRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onSuccess={handleRegistrationSuccess}
        liveEvent={liveEvent}
      />
    </div>
  )
}

export default Dashboard