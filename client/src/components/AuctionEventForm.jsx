import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { fetchPlayers } from '../store/slices/playersSlice';
import { createAuctionEvent, fetchAuctionEvents } from '../store/slices/auctionEventSlice';
import { PlusCircle, List, Check, X } from 'lucide-react';

const AuctionEventForm = () => {
  const dispatch = useDispatch();
  const { players } = useSelector((state) => state.players);
  const { events, loading } = useSelector((state) => state.auctionEvents);
  const [formData, setFormData] = useState({
    eventName: '',
    eventDescription: '',
    maxPlayers: 0,
    maxBidders: 8,
    selectedPlayers: []
  });
  const [activeTab, setActiveTab] = useState('create');
  
  useEffect(() => {
    dispatch(fetchPlayers());
    dispatch(fetchAuctionEvents());
  }, [dispatch]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxPlayers' || name === 'maxBidders' ? parseInt(value) || 0 : value
    }));
  };
  
  const handlePlayerSelection = (playerId) => {
    setFormData(prev => {
      const selectedPlayers = [...prev.selectedPlayers];
      const index = selectedPlayers.indexOf(playerId);
      
      if (index > -1) {
        selectedPlayers.splice(index, 1);
      } else {
        selectedPlayers.push(playerId);
      }
      
      return {
        ...prev,
        selectedPlayers,
        maxPlayers: selectedPlayers.length
      };
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.selectedPlayers.length === 0) {
      toast.error('Please select at least one player for the auction');
      return;
    }
    
    try {
      await dispatch(createAuctionEvent({
        eventName: formData.eventName,
        eventDescription: formData.eventDescription,
        maxPlayers: formData.maxPlayers,
        maxBidders: formData.maxBidders,
        eventPlayers: formData.selectedPlayers
      })).unwrap();
      
      toast.success('Auction event created successfully');
      
      setFormData({
        eventName: '',
        eventDescription: '',
        maxPlayers: 0,
        maxBidders: 8,
        selectedPlayers: []
      });
    } catch (error) {
      toast.error(error || 'Failed to create auction event');
    }
  };
  
  const selectAllPlayers = () => {
    setFormData(prev => ({
      ...prev,
      selectedPlayers: players.map(player => player._id),
      maxPlayers: players.length
    }));
  };
  
  const clearSelection = () => {
    setFormData(prev => ({
      ...prev,
      selectedPlayers: [],
      maxPlayers: 0
    }));
  };
  
  return (
    <div className="space-y-6 bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="border-b border-gray-700">
        <nav className="flex -mb-px space-x-4">
          <button
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
              activeTab === 'create' 
                ? 'border-purple-500 text-purple-400' 
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
            }`}
            onClick={() => setActiveTab('create')}
          >
            <PlusCircle className="h-5 w-5" />
            <span>Create Event</span>
          </button>
          <button
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
              activeTab === 'manage' 
                ? 'border-purple-500 text-purple-400' 
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
            }`}
            onClick={() => setActiveTab('manage')}
          >
            <List className="h-5 w-5" />
            <span>Manage Events</span>
          </button>
        </nav>
      </div>
      
      {activeTab === 'create' && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Create New Auction Event</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="eventName">
                  Event Name
                </label>
                <input
                  id="eventName"
                  name="eventName"
                  type="text"
                  value={formData.eventName}
                  onChange={handleChange}
                  className="bg-gray-900 border border-gray-600 rounded-md w-full py-2 px-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="maxBidders">
                  Maximum Bidders
                </label>
                <input
                  id="maxBidders"
                  name="maxBidders"
                  type="number"
                  min="2"
                  max="12"
                  value={formData.maxBidders}
                  onChange={handleChange}
                  className="bg-gray-900 border border-gray-600 rounded-md w-full py-2 px-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="eventDescription">
                Event Description
              </label>
              <textarea
                id="eventDescription"
                name="eventDescription"
                value={formData.eventDescription}
                onChange={handleChange}
                rows="3"
                className="bg-gray-900 border border-gray-600 rounded-md w-full py-2 px-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              ></textarea>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-300 text-sm font-bold">
                  Select Players
                </label>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={selectAllPlayers}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded-md transition-colors duration-200"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded-md transition-colors duration-200"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-400 mb-2">
                Selected: {formData.selectedPlayers.length} players
              </div>
              
              <div className="border border-gray-700 rounded-lg max-h-60 overflow-y-auto p-2 bg-gray-900">
                {players.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No players available. Please add players first.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {players.map((player) => (
                      <div 
                        key={player._id} 
                        className={`flex items-center p-2 rounded cursor-pointer transition-colors duration-200 ${formData.selectedPlayers.includes(player._id) ? 'bg-purple-600/30 border border-purple-500' : 'hover:bg-gray-700'}`}
                        onClick={() => handlePlayerSelection(player._id)}
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedPlayers.includes(player._id)}
                          readOnly
                          className="mr-3 h-4 w-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden mr-2 border border-gray-600">
                              {player.image ? (
                                <img 
                                  src={player.image ? `http://localhost:5001/uploads/players/${player.image.split('/').pop()}` : undefined} 
                                  alt={player.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs text-gray-400">{player.name.charAt(0)}</span>
                              )}
                            </div>
                            <span className="font-medium truncate text-white">{player.name}</span>
                          </div>
                          <div className="text-xs text-gray-400 truncate ml-8">{player.category} • ₹{player.basePrice}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || formData.selectedPlayers.length === 0}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {activeTab === 'manage' && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Manage Auction Events</h3>
          
          {events.length === 0 ? (
            <div className="text-center py-8 bg-gray-900 rounded-lg">
              <p className="text-gray-500">No auction events found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event._id} className="bg-gray-700 rounded-lg shadow-md p-4 border border-gray-600">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-lg text-white">{event.eventName}</h4>
                      <p className="text-gray-400 text-sm">{event.eventDescription}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      event.isLive ? 'bg-green-500/20 text-green-300' : 
                      event.isComplete ? 'bg-gray-500/20 text-gray-300' : 
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {event.isLive ? 'Live' : 
                       event.isComplete ? 'Completed' : 
                       'Draft'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm mt-4">
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <p className="text-gray-400">Players</p>
                      <p className="font-semibold text-white">{event.eventPlayers.length}</p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <p className="text-gray-400">Bidders</p>
                      <p className="font-semibold text-white">{event.registeredBidders.length}/{event.maxBidders}</p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <p className="text-gray-400">Status</p>
                      <p className="font-semibold text-white">{event.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuctionEventForm;
