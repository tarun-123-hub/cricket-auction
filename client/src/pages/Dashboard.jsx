import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
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
  Activity
} from 'lucide-react'
import axios from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const { isConnected } = useSelector((state) => state.socket)
  const { isActive, currentPlayer, soldPlayers, unsoldPlayers } = useSelector((state) => state.auction)
  
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/auction/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
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
      available: true
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
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-cricket font-bold text-white mb-2">
                Welcome back, {user?.username}!
              </h1>
              <p className="text-gray-400 text-lg">
                Ready for some cricket auction action?
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-full text-white text-sm font-semibold ${getRoleColor(user?.role)}`}>
                {user?.role?.toUpperCase()}
              </div>
              {user?.team && (
                <div className="px-4 py-2 rounded-full bg-gray-700 text-white text-sm font-semibold">
                  {user.team}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mb-8">
          <div className={`p-4 rounded-lg border ${
            isConnected 
              ? 'bg-green-900/30 border-green-500 text-green-200' 
              : 'bg-red-900/30 border-red-500 text-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-semibold">
                {isConnected ? 'Connected to Auction Room' : 'Disconnected from Auction Room'}
              </span>
            </div>
            <p className="text-sm mt-1 opacity-80">
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
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6 rounded-xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                    <Play className="h-6 w-6 mr-2" />
                    Live Auction in Progress
                  </h3>
                  <p className="text-yellow-100">
                    {currentPlayer.name} is currently being auctioned
                  </p>
                </div>
                <Link
                  to="/auction"
                  className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
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
                  <div className={`${action.color} p-6 rounded-xl shadow-xl transform transition-all duration-200 group-hover:scale-105 group-hover:shadow-2xl`}>
                    <Icon className="h-12 w-12 text-white mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recently Sold Players */}
          <div className="card">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Trophy className="h-6 w-6 mr-2 text-green-500" />
              Recently Sold Players
            </h3>
            {soldPlayers.length > 0 ? (
              <div className="space-y-3">
                {soldPlayers.slice(-5).reverse().map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-semibold text-white">{player.name}</p>
                      <p className="text-sm text-gray-400">{player.soldTo}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">
                        {formatCurrency(player.finalPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No players sold yet</p>
            )}
          </div>

          {/* Team Statistics */}
          <div className="card">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <TrendingUp className="h-6 w-6 mr-2 text-blue-500" />
              Team Spending
            </h3>
            {stats?.teamStats && stats.teamStats.length > 0 ? (
              <div className="space-y-3">
                {stats.teamStats.slice(0, 5).map((team, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-semibold text-white">{team._id}</p>
                      <p className="text-sm text-gray-400">{team.players} players</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-400">
                        {formatCurrency(team.totalSpent)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No team data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard