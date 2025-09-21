import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Crown, 
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  User,
  Shield
} from 'lucide-react';
import axios from '../../api/axios';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

const TeamsTab = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const { socket } = useSelector((state) => state.socket);

  useEffect(() => {
    fetchEvents();
    
    // Socket listeners
    if (socket) {
      socket.on('registration:added', handleRegistrationAdded);
      socket.on('purse:updated', handlePurseUpdated);
      socket.on('registration:status', handleRegistrationStatus);
      
      return () => {
        socket.off('registration:added', handleRegistrationAdded);
        socket.off('purse:updated', handlePurseUpdated);
        socket.off('registration:status', handleRegistrationStatus);
      };
    }
  }, [socket]);

  useEffect(() => {
    if (selectedEvent) {
      fetchEventTeams(selectedEvent._id);
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/auction-event');
      setEvents(response.data);
      if (response.data.length > 0 && !selectedEvent) {
        setSelectedEvent(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
    }
  };

  const fetchEventTeams = async (eventId) => {
    try {
      const response = await axios.get(`/auction-event/${eventId}`);
      setTeams(response.data.registeredBidders || []);
    } catch (error) {
      console.error('Error fetching event teams:', error);
      setTeams([]);
    }
  };

  const handleRegistrationAdded = ({ eventId, team }) => {
    if (selectedEvent && selectedEvent._id === eventId) {
      setTeams(prev => [...prev, team]);
    }
    
    // Update event counts
    setEvents(prev => prev.map(event => 
      event._id === eventId 
        ? { ...event, registeredTeamsCount: (event.registeredTeamsCount || 0) + 1 }
        : event
    ));
  };

  const handlePurseUpdated = ({ eventId, bidderId, purse }) => {
    if (selectedEvent && selectedEvent._id === eventId) {
      setTeams(prev => prev.map(team => 
        team._id === bidderId ? { ...team, purse } : team
      ));
    }
  };

  const handleRegistrationStatus = ({ eventId, bidderId, status }) => {
    if (selectedEvent && selectedEvent._id === eventId) {
      setTeams(prev => prev.map(team => 
        team._id === bidderId ? { ...team, status } : team
      ));
    }
  };

  const handleUpdatePurse = async (bidderId, newPurse) => {
    try {
      await axios.patch(`/auction-event/bidder/${bidderId}/purse`, { purse: newPurse });
      toast.success('Purse updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update purse');
    }
  };

  const handleApproveTeam = async (teamId) => {
    try {
      await axios.patch(`/auction-event/bidder/${teamId}/status`, { status: 'approved' });
      setTeams(prev => prev.map(t => t._id === teamId ? { ...t, status: 'approved' } : t));
      toast.success('Team approved!');
      
      // Emit socket event for real-time update
      if (socket) {
        socket.emit('team:approved', { teamId, eventId: selectedEvent._id });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve team');
    }
  };

  const handleRejectTeam = async (teamId) => {
    try {
      await axios.patch(`/auction-event/bidder/${teamId}/status`, { status: 'rejected' });
      setTeams(prev => prev.map(t => t._id === teamId ? { ...t, status: 'rejected' } : t));
      toast.success('Team rejected!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject team');
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const getStatusBadge = (status) => {
    const statusConfig = {
      registered: { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', label: 'Registered', icon: Clock },
      approved: { color: 'bg-green-500/20 text-green-300 border-green-500/30', label: 'Approved', icon: CheckCircle },
      rejected: { color: 'bg-red-500/20 text-red-300 border-red-500/30', label: 'Rejected', icon: XCircle }
    };
    
    const config = statusConfig[status] || statusConfig.registered;
    const Icon = config.icon;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cricket font-bold text-white">Teams Management</h1>
          <p className="text-gray-400 mt-2">Manage registered bidder teams</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{teams.length}</p>
          <p className="text-gray-400 text-sm">Registered Teams</p>
        </div>
      </div>

      {/* Event Selector */}
      <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
        <h2 className="text-xl font-bold text-white mb-4">Select Event</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <motion.button
              key={event._id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedEvent(event)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                selectedEvent?._id === event._id
                  ? 'border-blue-500 bg-blue-600/20'
                  : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
              }`}
            >
              <h3 className="font-bold text-white mb-2">{event.eventName}</h3>
              <div className="flex justify-between text-sm text-gray-300">
                <span>Teams: {event.registeredTeamsCount || 0}/{event.maxBidders}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  event.status === 'active' ? 'bg-green-500/20 text-green-300' :
                  event.status === 'paused' ? 'bg-orange-500/20 text-orange-300' :
                  'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {event.status}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Teams Grid */}
      {selectedEvent && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Teams for "{selectedEvent.eventName}"
            </h2>
            <div className="text-sm text-gray-400">
              {teams.length}/{selectedEvent.maxBidders} slots filled
            </div>
          </div>

          {teams.length === 0 ? (
            <div className="text-center py-16 bg-gray-800/50 rounded-2xl border border-gray-700/50">
              <Users className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Teams Registered</h3>
              <p className="text-gray-500">Teams will appear here once they register for this event</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {teams.map((team) => (
                  <motion.div
                    key={team._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -5 }}
                    className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    {/* Team Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-blue-500/30">
                          {team.teamImage ? (
                            <img 
                              src={`http://localhost:5001${team.teamImage}`}
                              alt={team.teamName} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Shield className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{team.teamName}</h3>
                          <p className="text-gray-400 text-sm">{team.ownerName}</p>
                        </div>
                      </div>
                      {getStatusBadge(team.status)}
                    </div>

                    {/* Team Stats */}
                    <div className="space-y-3 mb-4">
                      <div className="bg-green-900/30 rounded-lg p-3 border border-green-500/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-green-400" />
                            <span className="text-green-300 text-sm font-medium">Current Purse</span>
                          </div>
                          <span className="text-white font-bold">{formatCurrency(team.purse)}</span>
                        </div>
                      </div>
                      
                      <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-500/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-blue-400" />
                            <span className="text-blue-300 text-sm font-medium">Registered</span>
                          </div>
                          <span className="text-white text-sm">
                            {new Date(team.registeredAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Purse Update */}
                    <div className="mb-4">
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Update Purse
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          min="0"
                          defaultValue={team.purse}
                          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onBlur={(e) => {
                            const newPurse = parseInt(e.target.value) || 0;
                            if (newPurse !== team.purse) {
                              handleUpdatePurse(team._id, newPurse);
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {team.status === 'registered' && (
                        <>
                          <button
                            onClick={() => handleApproveTeam(team._id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-semibold flex items-center justify-center space-x-1 transition-colors duration-200"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleRejectTeam(team._id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-semibold flex items-center justify-center space-x-1 transition-colors duration-200"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                      
                      {team.status === 'approved' && (
                        <div className="flex-1 bg-green-600/20 text-green-300 px-3 py-2 rounded-lg font-semibold flex items-center justify-center space-x-1 border border-green-500/30">
                          <CheckCircle className="h-4 w-4" />
                          <span>Approved</span>
                        </div>
                      )}
                      
                      {team.status === 'rejected' && (
                        <div className="flex-1 bg-red-600/20 text-red-300 px-3 py-2 rounded-lg font-semibold flex items-center justify-center space-x-1 border border-red-500/30">
                          <XCircle className="h-4 w-4" />
                          <span>Rejected</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamsTab;