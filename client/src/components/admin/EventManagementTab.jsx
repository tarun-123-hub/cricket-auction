+import React, { useState, useEffect } from 'react';
+import { motion, AnimatePresence } from 'framer-motion';
+import { 
+  Plus, 
+  Calendar, 
+  Users, 
+  Trophy, 
+  DollarSign,
+  Clock,
+  Shuffle,
+  Save,
+  X,
+  Edit,
+  Trash2
+} from 'lucide-react';
+import axios from '../../api/axios';
+import toast from 'react-hot-toast';
+import { useSelector } from 'react-redux';
+
+const EventManagementTab = () => {
+  const [players, setPlayers] = useState([]);
+  const [events, setEvents] = useState([]);
+  const [loading, setLoading] = useState(false);
+  const [showCreateForm, setShowCreateForm] = useState(false);
+  const [editingEvent, setEditingEvent] = useState(null);
+  const { socket } = useSelector((state) => state.socket);
+  
+  const [formData, setFormData] = useState({
+    eventName: '',
+    eventDescription: '',
+    startTime: '',
+    maxBidders: 8,
+    teamPurseDefault: 10000000,
+    timerSeconds: 60,
+    incrementOnBidSeconds: 30,
+    randomizeOrder: false,
+    selectedPlayers: []
+  });
+  
+  const [playerPurses, setPlayerPurses] = useState({});
+
+  useEffect(() => {
+    fetchPlayers();
+    fetchEvents();
+  }, []);
+
+  const fetchPlayers = async () => {
+    try {
+      const response = await axios.get('/players');
+      setPlayers(response.data);
+    } catch (error) {
+      console.error('Error fetching players:', error);
+      toast.error('Failed to fetch players');
+    }
+  };
+
+  const fetchEvents = async () => {
+    try {
+      const response = await axios.get('/auction-event');
+      setEvents(response.data);
+    } catch (error) {
+      console.error('Error fetching events:', error);
+    }
+  };
+
+  const handleInputChange = (e) => {
+    const { name, value, type, checked } = e.target;
+    setFormData(prev => ({
+      ...prev,
+      [name]: type === 'checkbox' ? checked : value
+    }));
+  };
+
+  const handlePlayerSelection = (playerId) => {
+    setFormData(prev => {
+      const selectedPlayers = [...prev.selectedPlayers];
+      const index = selectedPlayers.indexOf(playerId);
+      
+      if (index > -1) {
+        selectedPlayers.splice(index, 1);
+        // Remove purse for deselected player
+        const newPurses = { ...playerPurses };
+        delete newPurses[playerId];
+        setPlayerPurses(newPurses);
+      } else {
+        selectedPlayers.push(playerId);
+      }
+      
+      return {
+        ...prev,
+        selectedPlayers
+      };
+    });
+  };
+
+  const handlePurseChange = (playerId, purse) => {
+    setPlayerPurses(prev => ({
+      ...prev,
+      [playerId]: parseInt(purse) || 0
+    }));
+  };
+
+  const handleSubmit = async (e) => {
+    e.preventDefault();
+    
+    if (formData.selectedPlayers.length === 0) {
+      toast.error('Please select at least one player');
+      return;
+    }
+    
+    // Validate that all selected players have auction prices
+    const missingPurses = formData.selectedPlayers.filter(playerId => 
+      !playerPurses[playerId] || playerPurses[playerId] <= 0
+    );
+    
+    if (missingPurses.length > 0) {
+      const playerNames = missingPurses.map(id => 
+        players.find(p => p._id === id)?.name || 'Unknown'
+      ).join(', ');
+      toast.error(`Missing auction price for: ${playerNames}`);
+      return;
+    }
+    
+    setLoading(true);
+    
+    try {
+      const eventPlayers = formData.selectedPlayers.map(playerId => ({
+        playerId,
+        auctionPrice: playerPurses[playerId]
+      }));
+      
+      const payload = {
+        ...formData,
+        eventPlayers
+      };
+      
+      if (editingEvent) {
+        await axios.put(`/auction-event/${editingEvent._id}`, payload);
+        toast.success('Event updated successfully!');
+      } else {
+        await axios.post('/auction-event', payload);
+        toast.success('Event created successfully!');
+      }
+      
+      // Reset form
+      setFormData({
+        eventName: '',
+        eventDescription: '',
+        startTime: '',
+        maxBidders: 8,
+        teamPurseDefault: 10000000,
+        timerSeconds: 60,
+        incrementOnBidSeconds: 30,
+        randomizeOrder: false,
+        selectedPlayers: []
+      });
+      setPlayerPurses({});
+      setShowCreateForm(false);
+      setEditingEvent(null);
+      fetchEvents();
+    } catch (error) {
+      console.error('Error saving event:', error);
+      toast.error(error.response?.data?.message || 'Failed to save event');
+    } finally {
+      setLoading(false);
+    }
+  };
+
+  const handleEditEvent = (event) => {
+    setEditingEvent(event);
+    setFormData({
+      eventName: event.eventName,
+      eventDescription: event.eventDescription || '',
+      startTime: event.startTime ? new Date(event.startTime).toISOString().slice(0, 16) : '',
+      maxBidders: event.maxBidders,
+      teamPurseDefault: event.teamPurseDefault,
+      timerSeconds: event.timerSeconds,
+      incrementOnBidSeconds: event.incrementOnBidSeconds,
+      randomizeOrder: event.randomizeOrder,
+      selectedPlayers: event.eventPlayers.map(p => p._id)
+    });
+    
+    // Set existing purses (would need to fetch from AuctionEventPlayer)
+    const purses = {};
+    event.eventPlayers.forEach(player => {
+      purses[player._id] = player.basePrice; // Fallback to base price
+    });
+    setPlayerPurses(purses);
+    setShowCreateForm(true);
+  };
+
+  const handleDeleteEvent = async (eventId) => {
+    if (!confirm('Are you sure you want to delete this event?')) return;
+    
+    try {
+      await axios.delete(`/auction-event/${eventId}`);
+      toast.success('Event deleted successfully!');
+      fetchEvents();
+    } catch (error) {
+      toast.error(error.response?.data?.message || 'Failed to delete event');
+    }
+  };
+
+  const formatCurrency = (amount) =>
+    new Intl.NumberFormat('en-IN', {
+      style: 'currency',
+      currency: 'INR',
+      minimumFractionDigits: 0,
+      maximumFractionDigits: 0,
+    }).format(amount);
+
+  return (
+    <div className="space-y-6">
+      <div className="flex items-center justify-between">
+        <div>
+          <h1 className="text-3xl font-cricket font-bold text-white">Event Management</h1>
+          <p className="text-gray-400 mt-2">Create and manage auction events</p>
+        </div>
+        <button
+          onClick={() => setShowCreateForm(true)}
+          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all duration-200 shadow-lg"
+        >
+          <Plus className="h-5 w-5" />
+          <span>Create Event</span>
+        </button>
+      </div>
+
+      {/* Events List */}
+      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
+        {events.map((event) => (
+          <motion.div
+            key={event._id}
+            initial={{ opacity: 0, y: 20 }}
+            animate={{ opacity: 1, y: 0 }}
+            className="bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl"
+          >
+            <div className="flex items-start justify-between mb-4">
+              <div>
+                <h3 className="text-xl font-bold text-white mb-2">{event.eventName}</h3>
+                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
+                  event.status === 'active' ? 'bg-green-500/20 text-green-300' :
+                  event.status === 'paused' ? 'bg-orange-500/20 text-orange-300' :
+                  event.status === 'ended' ? 'bg-gray-500/20 text-gray-300' :
+                  'bg-yellow-500/20 text-yellow-300'
+                }`}>
+                  {event.status}
+                </span>
+              </div>
+              <div className="flex space-x-2">
+                <button
+                  onClick={() => handleEditEvent(event)}
+                  disabled={event.status === 'active'}
+                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
+                >
+                  <Edit className="h-4 w-4" />
+                </button>
+                <button
+                  onClick={() => handleDeleteEvent(event._id)}
+                  disabled={event.status === 'active'}
+                  className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
+                >
+                  <Trash2 className="h-4 w-4" />
+                </button>
+              </div>
+            </div>
+            
+            <div className="space-y-3 text-sm text-gray-300">
+              <div className="flex justify-between">
+                <span>Players:</span>
+                <span className="font-semibold">{event.playersCount || 0}</span>
+              </div>
+              <div className="flex justify-between">
+                <span>Max Bidders:</span>
+                <span className="font-semibold">{event.maxBidders}</span>
+              </div>
+              <div className="flex justify-between">
+                <span>Team Purse:</span>
+                <span className="font-semibold">{formatCurrency(event.teamPurseDefault)}</span>
+              </div>
+              {event.startTime && (
+                <div className="flex justify-between">
+                  <span>Start Time:</span>
+                  <span className="font-semibold">
+                    {new Date(event.startTime).toLocaleDateString()}
+                  </span>
+                </div>
+              )}
+            </div>
+          </motion.div>
+        ))}
+      </div>
+
+      {/* Create/Edit Event Modal */}
+      <AnimatePresence>
+        {showCreateForm && (
+          <motion.div
+            initial={{ opacity: 0 }}
+            animate={{ opacity: 1 }}
+            exit={{ opacity: 0 }}
+            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
+            onClick={() => {
+              setShowCreateForm(false);
+              setEditingEvent(null);
+            }}
+          >
+            <motion.div
+              initial={{ scale: 0.8, opacity: 0 }}
+              animate={{ scale: 1, opacity: 1 }}
+              exit={{ scale: 0.8, opacity: 0 }}
+              className="bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
+              onClick={(e) => e.stopPropagation()}
+            >
+              <div className="flex items-center justify-between mb-6">
+                <h2 className="text-2xl font-bold text-white">
+                  {editingEvent ? 'Edit Event' : 'Create New Event'}
+                </h2>
+                <button
+                  onClick={() => {
+                    setShowCreateForm(false);
+                    setEditingEvent(null);
+                  }}
+                  className="text-gray-400 hover:text-white transition-colors duration-200"
+                >
+                  <X className="h-6 w-6" />
+                </button>
+              </div>
+
+              <form onSubmit={handleSubmit} className="space-y-6">
+                {/* Basic Info */}
+                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
+                  <div>
+                    <label className="block text-gray-300 text-sm font-bold mb-2">
+                      Event Name *
+                    </label>
+                    <input
+                      name="eventName"
+                      type="text"
+                      value={formData.eventName}
+                      onChange={handleInputChange}
+                      className="input-field"
+                      required
+                    />
+                  </div>
+                  
+                  <div>
+                    <label className="block text-gray-300 text-sm font-bold mb-2">
+                      Start Time
+                    </label>
+                    <input
+                      name="startTime"
+                      type="datetime-local"
+                      value={formData.startTime}
+                      onChange={handleInputChange}
+                      className="input-field"
+                    />
+                  </div>
+                </div>
+
+                <div>
+                  <label className="block text-gray-300 text-sm font-bold mb-2">
+                    Description
+                  </label>
+                  <textarea
+                    name="eventDescription"
+                    value={formData.eventDescription}
+                    onChange={handleInputChange}
+                    rows="3"
+                    className="input-field"
+                  />
+                </div>
+
+                {/* Settings */}
+                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
+                  <div>
+                    <label className="block text-gray-300 text-sm font-bold mb-2">
+                      Max Bidders
+                    </label>
+                    <input
+                      name="maxBidders"
+                      type="number"
+                      min="2"
+                      max="16"
+                      value={formData.maxBidders}
+                      onChange={handleInputChange}
+                      className="input-field"
+                      required
+                    />
+                  </div>
+                  
+                  <div>
+                    <label className="block text-gray-300 text-sm font-bold mb-2">
+                      Team Purse Default
+                    </label>
+                    <input
+                      name="teamPurseDefault"
+                      type="number"
+                      min="0"
+                      value={formData.teamPurseDefault}
+                      onChange={handleInputChange}
+                      className="input-field"
+                      required
+                    />
+                  </div>
+                  
+                  <div>
+                    <label className="block text-gray-300 text-sm font-bold mb-2">
+                      Timer (seconds)
+                    </label>
+                    <input
+                      name="timerSeconds"
+                      type="number"
+                      min="10"
+                      max="300"
+                      value={formData.timerSeconds}
+                      onChange={handleInputChange}
+                      className="input-field"
+                      required
+                    />
+                  </div>
+                </div>
+
+                <div className="flex items-center space-x-4">
+                  <label className="flex items-center space-x-2">
+                    <input
+                      name="randomizeOrder"
+                      type="checkbox"
+                      checked={formData.randomizeOrder}
+                      onChange={handleInputChange}
+                      className="rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
+                    />
+                    <span className="text-gray-300">Randomize Player Order</span>
+                  </label>
+                </div>

+                {/* Player Selection */}
+                <div>
+                  <label className="block text-gray-300 text-sm font-bold mb-4">
+                    Select Players *
+                  </label>
+                  
+                  <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
+                    {players.length === 0 ? (
+                      <p className="text-center text-gray-500 py-4">No players available</p>
+                    ) : (
+                      <div className="space-y-3">
+                        {players.map((player) => (
+                          <div 
+                            key={player._id}
+                            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
+                              formData.selectedPlayers.includes(player._id)
+                                ? 'bg-purple-600/20 border-purple-500'
+                                : 'bg-gray-800 border-gray-700 hover:border-gray-600'
+                            }`}
+                          >
+                            <div className="flex items-center space-x-3">
+                              <input
+                                type="checkbox"
+                                checked={formData.selectedPlayers.includes(player._id)}
+                                onChange={() => handlePlayerSelection(player._id)}
+                                className="rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
+                              />
+                              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
+                                {player.image ? (
+                                  <img 
+                                    src={`http://localhost:5001${player.image}`}
+                                    alt={player.name} 
+                                    className="w-full h-full object-cover"
+                                  />
+                                ) : (
+                                  <span className="text-gray-400 text-sm">{player.name.charAt(0)}</span>
+                                )}
+                              </div>
+                              <div>
+                                <p className="font-semibold text-white">{player.name}</p>
+                                <p className="text-sm text-gray-400">{player.role} • {formatCurrency(player.basePrice)}</p>
+                              </div>
+                            </div>
+                            
+                            {formData.selectedPlayers.includes(player._id) && (
+                              <div className="flex items-center space-x-2">
+                                <label className="text-sm text-gray-300">Auction Price:</label>
+                                <input
+                                  type="number"
+                                  min="0"
+                                  value={playerPurses[player._id] || ''}
+                                  onChange={(e) => handlePurseChange(player._id, e.target.value)}
+                                  className="w-32 px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
+                                  placeholder="Enter price"
+                                />
+                              </div>
+                            )}
+                          </div>
+                        ))}
+                      </div>
+                    )}
+                  </div>
+                  
+                  <div className="mt-2 text-sm text-gray-400">
+                    Selected: {formData.selectedPlayers.length} players
+                  </div>
+                </div>

+                {/* Submit Button */}
+                <div className="flex justify-end space-x-4 pt-4">
+                  <button
+                    type="button"
+                    onClick={() => {
+                      setShowCreateForm(false);
+                      setEditingEvent(null);
+                    }}
+                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors duration-200"
+                  >
+                    Cancel
+                  </button>
+                  <button
+                    type="submit"
+                    disabled={loading}
+                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
+                  >
+                    {loading ? (
+                      <>
+                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
+                        <span>{editingEvent ? 'Updating...' : 'Creating...'}</span>
+                      </>
+                    ) : (
+                      <>
+                        <Save className="h-5 w-5" />
+                        <span>{editingEvent ? 'Update Event' : 'Create Event'}</span>
+                      </>
+                    )}
+                  </button>
+                </div>
+              </form>
+            </motion.div>
+          </motion.div>
+        )}
+      </AnimatePresence>
+    </div>
+  );
+};

+export default EventManagementTab;
+