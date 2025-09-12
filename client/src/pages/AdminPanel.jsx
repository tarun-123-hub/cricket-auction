import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { startAuction } from '../store/slices/auctionSlice'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Users, 
  Settings, 
  Play, 
  DollarSign, 
  Edit3, 
  Save, 
  Trophy,
  UserPlus,
  Crown
} from 'lucide-react'
import axios from '../api/axios'
import toast from 'react-hot-toast'

const AdminPanel = () => {
  const { players } = useSelector((s) => s.players)
  const { socket } = useSelector((s) => s.socket)
  const [liveEvent, setLiveEvent] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [eventName, setEventName] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('')
  const [maxBidders, setMaxBidders] = useState('8')
  const [editingPurse, setEditingPurse] = useState({})
  const [purseValues, setPurseValues] = useState({})
  const [searchAvail, setSearchAvail] = useState('')
  const [searchSel, setSearchSel] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  React.useEffect(() => {
    fetchLiveEvent()
  }, [])

  const fetchLiveEvent = async () => {
    try {
      const response = await axios.get('/api/auction-event/live')
      setLiveEvent(response.data)
      
      if (response.data) {
        setEventName(response.data.eventName)
        setEventDescription(response.data.eventDescription)
        setMaxPlayers(response.data.maxPlayers.toString())
        setMaxBidders(response.data.maxBidders.toString())
        setSelectedIds(response.data.eventPlayers.map(p => p._id))
        
        // Initialize purse values
        const purses = {}
        response.data.registeredBidders.forEach(bidder => {
          purses[bidder._id] = bidder.purse
        })
        setPurseValues(purses)
      }
    } catch (error) {
      console.error('Error fetching live event:', error)
    }
  }

  const onCreate = async (e) => {
    e.preventDefault()
    
    if (!eventName.trim()) {
      toast.error('Event name is required')
      return
    }
    
    if (selectedIds.length === 0) {
      toast.error('Please select at least one player')
      return
    }
    
    setIsLoading(true)
    
    try {
      await axios.post('/api/auction-event', {
        eventName: eventName.trim(),
        eventDescription: eventDescription.trim(),
        maxPlayers: parseInt(maxPlayers) || 0,
        maxBidders: parseInt(maxBidders) || 8,
        eventPlayers: selectedIds
      })
      
      toast.success('Auction event created successfully!')
      fetchLiveEvent()
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create event'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const updatePurse = async (bidderId, purse) => {
    try {
      await axios.patch(`/api/auction-event/bidder/${bidderId}/purse`, { purse })
      toast.success('Purse updated successfully!')
      
      // Emit socket event for real-time update
      if (socket && socket.connected) {
        socket.emit('purse-updated')
      }
      
      fetchLiveEvent()
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update purse'
      toast.error(message)
    }
  }

  const startAuctionEvent = async () => {
    if (!liveEvent || liveEvent.registeredBidders.length === 0) {
      toast.error('No bidders registered for this event')
      return
    }
    
    // Check if all bidders have purse allocated
    const biddersWithoutPurse = liveEvent.registeredBidders.filter(b => b.purse === 0)
    if (biddersWithoutPurse.length > 0) {
      toast.error('Please allocate purse for all bidders before starting')
      return
    }
    
    try {
      await axios.post('/api/auction-event/start')
      toast.success('Auction started successfully!')
      
      // Start with first player
      const firstPlayer = liveEvent.eventPlayers[0]
      if (firstPlayer) {
        dispatch(startAuction({
          currentPlayer: firstPlayer,
          baseBid: firstPlayer.basePrice,
          eventName: liveEvent.eventName,
          maxPlayers: liveEvent.maxPlayers
        }))
        navigate('/auction')
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to start auction'
      toast.error(message)
    }
  }

  const handlePurseEdit = (bidderId, value) => {
    setPurseValues(prev => ({
      ...prev,
      [bidderId]: parseInt(value) || 0
    }))
  }

  const savePurse = (bidderId) => {
    const purse = purseValues[bidderId] || 0
    updatePurse(bidderId, purse)
    setEditingPurse(prev => ({
      ...prev,
      [bidderId]: false
    }))
  }

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  const canStart = useMemo(() => {
    return liveEvent && 
           liveEvent.eventPlayers.length > 0 && 
           liveEvent.registeredBidders.length > 0 &&
           liveEvent.registeredBidders.every(b => b.purse > 0)
  }, [liveEvent])

  const activateEvent = () => {
    if (socket && socket.connected) {
      socket.emit('activate-event')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-cricket font-bold text-white flex items-center">
            <Crown className="h-6 w-6 mr-3 text-yellow-500" />
            Admin Panel
          </h1>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/admin/players')}
              className="btn-secondary flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Manage Players</span>
            </button>
          </div>
        </div>

        {/* Live Event Status */}
        {liveEvent ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-600 to-teal-600 p-6 rounded-xl shadow-xl border border-green-500/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-2 flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Live Event: {liveEvent.eventName}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-green-100">Players</p>
                    <p className="text-white font-semibold">{liveEvent.eventPlayers.length}</p>
                  </div>
                  <div>
                    <p className="text-green-100">Bidders</p>
                    <p className="text-white font-semibold">{liveEvent.registeredBidders.length}/{liveEvent.maxBidders}</p>
                  </div>
                  <div>
                    <p className="text-green-100">Status</p>
                    <p className="text-white font-semibold">{liveEvent.isActive ? 'Active' : 'Ready'}</p>
                  </div>
                  <div>
                    <p className="text-green-100">Complete</p>
                    <p className="text-white font-semibold">{liveEvent.isComplete ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                {!liveEvent.isActive && canStart && (
                  <button
                    onClick={startAuctionEvent}
                    className="bg-white text-green-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors duration-200 text-sm shadow-lg flex items-center space-x-2"
                  >
                    <Play className="h-4 w-4" />
                    <span>Start Auction</span>
                  </button>
                )}
                {liveEvent.isActive && (
                  <button
                    onClick={() => navigate('/auction')}
                    className="bg-white text-green-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors duration-200 text-sm shadow-lg"
                  >
                    Go to Auction Room
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-xl shadow-xl border border-blue-500/30"
          >
            <h2 className="text-xl font-bold text-white mb-2">No Live Event</h2>
            <p className="text-blue-100 text-sm">Create a new auction event to get started</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event Creation/Management */}
          <div className="lg:col-span-2 space-y-6">
            {/* Registered Bidders */}
            {liveEvent && liveEvent.registeredBidders.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <UserPlus className="h-5 w-5 mr-2 text-blue-500" />
                  Registered Bidders ({liveEvent.registeredBidders.length})
                </h3>
                <div className="space-y-3">
                  {liveEvent.registeredBidders.map((bidder) => (
                    <div key={bidder._id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {bidder.teamImage ? (
                            <img
                              src={bidder.teamImage}
                              alt={bidder.teamName}
                              className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/30"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <Trophy className="h-6 w-6 text-white" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-white text-base">{bidder.teamName}</h4>
                            <p className="text-sm text-gray-400">Owner: {bidder.ownerName}</p>
                            <p className="text-xs text-gray-500">
                              Registered: {new Date(bidder.registeredAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {editingPurse[bidder._id] ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={purseValues[bidder._id] || 0}
                                onChange={(e) => handlePurseEdit(bidder._id, e.target.value)}
                                className="input-field w-32 text-sm"
                                placeholder="Enter amount"
                                min="0"
                              />
                              <button
                                onClick={() => savePurse(bidder._id)}
                                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md transition-colors duration-200"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div className="text-right">
                                <p className="text-sm text-gray-400">Purse</p>
                                <p className="font-bold text-green-400 text-base">
                                  {bidder.purse > 0 ? formatCurrency(bidder.purse) : 'Not Set'}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  setEditingPurse(prev => ({ ...prev, [bidder._id]: true }))
                                  setPurseValues(prev => ({ ...prev, [bidder._id]: bidder.purse }))
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition-colors duration-200"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event Builder */}
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-purple-500" />
                {liveEvent ? 'Update Event' : 'Create Auction Event'}
              </h3>
              <form onSubmit={onCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Event Name *</label>
                    <input 
                      className="input-field" 
                      placeholder="e.g., Namma Premier Auction 2025" 
                      value={eventName} 
                      onChange={(e) => setEventName(e.target.value)}
                      disabled={!!liveEvent}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Max Bidders</label>
                    <input 
                      className="input-field" 
                      type="number" 
                      min="2" 
                      max="16" 
                      placeholder="8" 
                      value={maxBidders} 
                      onChange={(e) => setMaxBidders(e.target.value)}
                      disabled={!!liveEvent}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Description</label>
                  <textarea 
                    className="input-field h-20" 
                    placeholder="Short description" 
                    value={eventDescription} 
                    onChange={(e) => setEventDescription(e.target.value)}
                    disabled={!!liveEvent}
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Max Players</label>
                  <input 
                    className="input-field" 
                    type="number" 
                    min="1" 
                    placeholder="150" 
                    value={maxPlayers} 
                    onChange={(e) => setMaxPlayers(e.target.value)}
                    disabled={!!liveEvent}
                  />
                </div>
                
                {!liveEvent && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Select Players for Event</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-gray-800 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400">Available Players</span>
                            <input 
                              className="input-field h-8 w-32 text-xs" 
                              placeholder="Search" 
                              value={searchAvail} 
                              onChange={(e) => setSearchAvail(e.target.value)} 
                            />
                          </div>
                          <div className="h-40 overflow-auto space-y-1">
                            {players
                              .filter(p => !selectedIds.includes(p._id))
                              .filter(p => p.name.toLowerCase().includes(searchAvail.toLowerCase()))
                              .map(p => (
                                <div key={p._id} className="flex items-center justify-between bg-gray-700 rounded px-2 py-1 text-xs text-gray-200">
                                  <span className="truncate">{p.name}</span>
                                  <button 
                                    type="button" 
                                    className="text-xs bg-blue-600 px-2 py-0.5 rounded hover:bg-blue-700" 
                                    onClick={() => setSelectedIds(prev => [...prev, p._id])}
                                  >
                                    Add
                                  </button>
                                </div>
                              ))}
                          </div>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400">Selected Players</span>
                            <input 
                              className="input-field h-8 w-32 text-xs" 
                              placeholder="Search" 
                              value={searchSel} 
                              onChange={(e) => setSearchSel(e.target.value)} 
                            />
                          </div>
                          <div className="h-40 overflow-auto space-y-1">
                            {players
                              .filter(p => selectedIds.includes(p._id))
                              .filter(p => p.name.toLowerCase().includes(searchSel.toLowerCase()))
                              .map(p => (
                                <div key={p._id} className="flex items-center justify-between bg-gray-700 rounded px-2 py-1 text-xs text-gray-200">
                                  <span className="truncate">{p.name}</span>
                                  <button 
                                    type="button" 
                                    className="text-xs bg-red-600 px-2 py-0.5 rounded hover:bg-red-700" 
                                    onClick={() => setSelectedIds(prev => prev.filter(id => id !== p._id))}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3">
                      <button 
                        type="button" 
                        className="btn-secondary" 
                        onClick={() => {
                          setSelectedIds([])
                          setEventName('')
                          setEventDescription('')
                          setMaxPlayers('')
                          setMaxBidders('8')
                        }}
                      >
                        Reset
                      </button>
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Creating...' : 'Create Event'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-base font-semibold text-white mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/admin/players')}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Manage Players</span>
                </button>
                <button 
                  onClick={() => navigate('/auction')}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                  disabled={!liveEvent}
                >
                  <Play className="h-4 w-4" />
                  <span>Go to Auction</span>
                </button>
              </div>
            </div>
            
            {liveEvent && (
              <div className="card">
                <h3 className="text-base font-semibold text-white mb-3">Event Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Players</span>
                    <span className="text-white font-semibold">{liveEvent.eventPlayers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Bidders</span>
                    <span className="text-white font-semibold">{liveEvent.registeredBidders.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Status</span>
                    <span className={`font-semibold ${liveEvent.isActive ? 'text-green-400' : 'text-yellow-400'}`}>
                      {liveEvent.isActive ? 'Active' : 'Ready'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;