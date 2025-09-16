import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Trash2, 
  Users, 
  Trophy, 
  Calendar,
  Eye,
  Settings,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import axios from '../../api/axios';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

const AuctionControlTab = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const { socket } = useSelector((state) => state.socket);

  useEffect(() => {
    fetchEvents();
    
    // Socket listeners
    if (socket) {
      socket.on('event:created', handleEventCreated);
      socket.on('event:updated', handleEventUpdated);
      socket.on('event:deleted', handleEventDeleted);
      socket.on('event:activated', handleEventActivated);
      socket.on('event:deactivated', handleEventDeactivated);
      socket.on('registration:added', handleRegistrationAdded);
      
      return () => {
        socket.off('event:created', handleEventCreated);
        socket.off('event:updated', handleEventUpdated);
        socket.off('event:deleted', handleEventDeleted);
        socket.off('event:activated', handleEventActivated);
        socket.off('event:deactivated', handleEventDeactivated);
        socket.off('registration:added', handleRegistrationAdded);
      };
    }
  }, [socket]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/auction-event');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleEventCreated = (event) => {
    setEvents(prev => [event, ...prev]);
    toast.success('New event created!');
  };

  const handleEventUpdated = (updatedEvent) => {
    setEvents(prev => prev.map(event => 
      event._id === updatedEvent._id ? updatedEvent : event
    ));
    toast.success('Event updated!');
  };

  const handleEventDeleted = ({ eventId }) => {
    setEvents(prev => prev.filter(event => event._id !== eventId));
    toast.success('Event deleted!');
  };

  const handleEventActivated = ({ eventId, event }) => {
    setEvents(prev => prev.map(e => ({
      ...e,
      status: e._id === eventId ? 'active' : (e.status === 'active' ? 'paused' : e.status)
    })));
    toast.success('Event activated!');
  };

  const handleEventDeactivated = ({ eventId }) => {
    setEvents(prev => prev.map(e => 
      e._id === eventId ? { ...e, status: 'paused' } : e
    ));
    toast.success('Event deactivated!');
  };

  const handleRegistrationAdded = ({ eventId, team }) => {
    setEvents(prev => prev.map(event => 
      event._id === eventId 
        ? { ...event, registeredTeamsCount: (event.registeredTeamsCount || 0) + 1 }
        : event
    ));
    toast.success(`${team.teamName} registered!`);
  };

  const handleActivateEvent = async (eventId) => {
    try {
      await axios.post(`/auction-event/${eventId}/activate`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to activate event');
    }
  };

  const handleDeactivateEvent = async (eventId) => {
    try {
      await axios.post(`/auction-event/${eventId}/deactivate`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to deactivate event');
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    
    try {
      await axios.delete(`/auction-event/${eventToDelete._id}`);
      setShowDeleteModal(false);
      setEventToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', label: 'Draft' },
      active: { color: 'bg-green-500/20 text-green-300 border-green-500/30', label: 'Active' },
      paused: { color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', label: 'Paused' },
      ended: { color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', label: 'Ended' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cricket font-bold text-white">Auction Control</h1>
          <p className="text-gray-400 mt-2">Manage and control auction events</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{events.length}</p>
          <p className="text-gray-400 text-sm">Total Events</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-2xl border border-gray-700/50">
          <Trophy className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Events Created</h3>
          <p className="text-gray-500">Create your first auction event to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {events.map((event) => (
              <motion.div
                key={event._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                      {event.eventName}
                    </h3>
                    {getStatusBadge(event.status)}
                  </div>
                </div>

                {/* Description */}
                {event.eventDescription && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {event.eventDescription}
                  </p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-500/20">
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-4 w-4 text-blue-400" />
                      <span className="text-blue-300 text-sm font-medium">Players</span>
                    </div>
                    <p className="text-xl font-bold text-white mt-1">
                      {event.playersCount || 0}
                    </p>
                  </div>
                  
                  <div className="bg-green-900/30 rounded-lg p-3 border border-green-500/20">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-green-400" />
                      <span className="text-green-300 text-sm font-medium">Teams</span>
                    </div>
                    <p className="text-xl font-bold text-white mt-1">
                      {event.registeredTeamsCount || 0}/{event.maxBidders}
                    </p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex justify-between text-sm text-gray-400 mb-6">
                  <span>Sold: {event.playersSold || 0}</span>
                  <span>Unsold: {event.playersUnsold || 0}</span>
                  <span>Bids: {event.totalBids || 0}</span>
                </div>

                {/* Start Time */}
                {event.startTime && (
                  <div className="flex items-center space-x-2 text-gray-400 text-sm mb-4">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(event.startTime).toLocaleDateString()}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {event.status === 'draft' && (
                    <button
                      onClick={() => handleActivateEvent(event._id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors duration-200"
                    >
                      <Play className="h-4 w-4" />
                      <span>Activate</span>
                    </button>
                  )}
                  
                  {event.status === 'active' && (
                    <button
                      onClick={() => handleDeactivateEvent(event._id)}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors duration-200"
                    >
                      <Pause className="h-4 w-4" />
                      <span>Pause</span>
                    </button>
                  )}
                  
                  {event.status === 'paused' && (
                    <button
                      onClick={() => handleActivateEvent(event._id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors duration-200"
                    >
                      <Play className="h-4 w-4" />
                      <span>Resume</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setEventToDelete(event);
                      setShowDeleteModal(true);
                    }}
                    disabled={event.status === 'active'}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-red-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Delete Event</h3>
                <p className="text-gray-400 mb-6">
                  Are you sure you want to delete "{eventToDelete?.eventName}"? This action cannot be undone.
                </p>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteEvent}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuctionControlTab;