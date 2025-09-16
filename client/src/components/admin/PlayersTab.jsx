import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Upload, 
  User, 
  Trophy, 
  DollarSign,
  Edit,
  Trash2,
  X,
  Save,
  Camera,
  Star
} from 'lucide-react';
import axios from '../../api/axios';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

const PlayersTab = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { socket } = useSelector((state) => state.socket);
  
  const [formData, setFormData] = useState({
    name: '',
    role: 'Batsman',
    basePrice: 100000,
    age: 25,
    country: 'India',
    battingStyle: 'Right-handed',
    bowlingStyle: 'None',
    stats: {
      matches: 0,
      runs: 0,
      wickets: 0,
      average: 0,
      strikeRate: 0
    }
  });
  
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchPlayers();
    
    // Socket listeners
    if (socket) {
      socket.on('player:added', handlePlayerAdded);
      socket.on('player:updated', handlePlayerUpdated);
      socket.on('player:image_uploaded', handleImageUploaded);
      
      return () => {
        socket.off('player:added', handlePlayerAdded);
        socket.off('player:updated', handlePlayerUpdated);
        socket.off('player:image_uploaded', handleImageUploaded);
      };
    }
  }, [socket]);

  const fetchPlayers = async () => {
    try {
      const response = await axios.get('/players');
      setPlayers(response.data);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast.error('Failed to fetch players');
    }
  };

  const handlePlayerAdded = (player) => {
    setPlayers(prev => [player, ...prev]);
    toast.success(`${player.name} added successfully!`);
  };

  const handlePlayerUpdated = (updatedPlayer) => {
    setPlayers(prev => prev.map(player => 
      player._id === updatedPlayer._id ? updatedPlayer : player
    ));
    toast.success(`${updatedPlayer.name} updated successfully!`);
  };

  const handleImageUploaded = ({ playerId, photoUrl }) => {
    setPlayers(prev => prev.map(player => 
      player._id === playerId ? { ...player, image: photoUrl } : player
    ));
    toast.success('Player image updated!');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('stats.')) {
      const statName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          [statName]: parseFloat(value) || 0
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'basePrice' || name === 'age' ? parseInt(value) || 0 : value
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'stats') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else {
          submitData.append(key, formData[key]);
        }
      });
      
      if (selectedImage) {
        submitData.append('image', selectedImage);
      }
      
      if (editingPlayer) {
        await axios.put(`/players/${editingPlayer._id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('/players', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      // Reset form
      setFormData({
        name: '',
        role: 'Batsman',
        basePrice: 100000,
        age: 25,
        country: 'India',
        battingStyle: 'Right-handed',
        bowlingStyle: 'None',
        stats: {
          matches: 0,
          runs: 0,
          wickets: 0,
          average: 0,
          strikeRate: 0
        }
      });
      setSelectedImage(null);
      setImagePreview(null);
      setShowCreateForm(false);
      setEditingPlayer(null);
      fetchPlayers();
    } catch (error) {
      console.error('Error saving player:', error);
      toast.error(error.response?.data?.message || 'Failed to save player');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlayer = (player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      role: player.role,
      basePrice: player.basePrice,
      age: player.age,
      country: player.country,
      battingStyle: player.battingStyle,
      bowlingStyle: player.bowlingStyle,
      stats: player.stats || {
        matches: 0,
        runs: 0,
        wickets: 0,
        average: 0,
        strikeRate: 0
      }
    });
    setImagePreview(player.image ? `http://localhost:5001${player.image}` : null);
    setShowCreateForm(true);
  };

  const handleDeletePlayer = async (playerId) => {
    if (!confirm('Are you sure you want to delete this player?')) return;
    
    try {
      await axios.delete(`/players/${playerId}`);
      setPlayers(prev => prev.filter(p => p._id !== playerId));
      toast.success('Player deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete player');
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cricket font-bold text-white">Players Management</h1>
          <p className="text-gray-400 mt-2">Add and manage cricket players</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all duration-200 shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Add Player</span>
        </button>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {players.map((player) => (
            <motion.div
              key={player._id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -5 }}
              className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              {/* Player Image */}
              <div className="relative mb-4">
                <div className="w-20 h-20 mx-auto bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-4 border-blue-500/30">
                  {player.image ? (
                    <img 
                      src={`http://localhost:5001${player.image}`}
                      alt={player.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                <div className="absolute -top-2 -right-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    player.auctionStatus === 'sold' ? 'bg-green-500' :
                    player.auctionStatus === 'unsold' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`}>
                    <Star className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>

              {/* Player Info */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-white mb-1">{player.name}</h3>
                <p className="text-blue-400 text-sm font-medium">{player.role}</p>
                <p className="text-gray-400 text-xs">{player.country} • {player.age} yrs</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-green-900/30 rounded-lg p-2 border border-green-500/20">
                  <p className="text-green-300 text-xs font-medium">Base Price</p>
                  <p className="text-white font-bold text-sm">{formatCurrency(player.basePrice)}</p>
                </div>
                <div className="bg-blue-900/30 rounded-lg p-2 border border-blue-500/20">
                  <p className="text-blue-300 text-xs font-medium">Matches</p>
                  <p className="text-white font-bold text-sm">{player.stats?.matches || 0}</p>
                </div>
                <div className="bg-purple-900/30 rounded-lg p-2 border border-purple-500/20">
                  <p className="text-purple-300 text-xs font-medium">Runs</p>
                  <p className="text-white font-bold text-sm">{player.stats?.runs || 0}</p>
                </div>
                <div className="bg-orange-900/30 rounded-lg p-2 border border-orange-500/20">
                  <p className="text-orange-300 text-xs font-medium">Average</p>
                  <p className="text-white font-bold text-sm">{player.stats?.average || 0}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditPlayer(player)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold flex items-center justify-center space-x-1 transition-colors duration-200"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeletePlayer(player._id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-semibold flex items-center justify-center transition-colors duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Create/Edit Player Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowCreateForm(false);
              setEditingPlayer(null);
              setImagePreview(null);
              setSelectedImage(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingPlayer ? 'Edit Player' : 'Add New Player'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingPlayer(null);
                    setImagePreview(null);
                    setSelectedImage(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-4 border-gray-600 mb-4">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                  <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold cursor-pointer flex items-center justify-center space-x-2 mx-auto w-fit transition-colors duration-200">
                    <Upload className="h-4 w-4" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-2">JPG, PNG or GIF. Max size 5MB.</p>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-2">
                      Player Name *
                    </label>
                    <input
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-2">
                      Age *
                    </label>
                    <input
                      name="age"
                      type="number"
                      min="16"
                      max="45"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-2">
                      Country *
                    </label>
                    <input
                      name="country"
                      type="text"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-2">
                      Role *
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    >
                      <option value="Batsman">Batsman</option>
                      <option value="Bowler">Bowler</option>
                      <option value="All-rounder">All-rounder</option>
                      <option value="Wicket-keeper">Wicket-keeper</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-2">
                      Batting Style
                    </label>
                    <select
                      name="battingStyle"
                      value={formData.battingStyle}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="Right-handed">Right-handed</option>
                      <option value="Left-handed">Left-handed</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-2">
                      Bowling Style
                    </label>
                    <select
                      name="bowlingStyle"
                      value={formData.bowlingStyle}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="None">None</option>
                      <option value="Right-arm fast">Right-arm fast</option>
                      <option value="Left-arm fast">Left-arm fast</option>
                      <option value="Right-arm medium">Right-arm medium</option>
                      <option value="Left-arm medium">Left-arm medium</option>
                      <option value="Right-arm off-spin">Right-arm off-spin</option>
                      <option value="Left-arm orthodox">Left-arm orthodox</option>
                      <option value="Right-arm leg-spin">Right-arm leg-spin</option>
                      <option value="Left-arm chinaman">Left-arm chinaman</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-bold mb-2">
                    Base Price (₹) *
                  </label>
                  <input
                    name="basePrice"
                    type="number"
                    min="100000"
                    step="50000"
                    value={formData.basePrice}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>

                {/* Stats */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Player Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-bold mb-2">
                        Matches
                      </label>
                      <input
                        name="stats.matches"
                        type="number"
                        min="0"
                        value={formData.stats.matches}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 text-sm font-bold mb-2">
                        Runs
                      </label>
                      <input
                        name="stats.runs"
                        type="number"
                        min="0"
                        value={formData.stats.runs}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 text-sm font-bold mb-2">
                        Wickets
                      </label>
                      <input
                        name="stats.wickets"
                        type="number"
                        min="0"
                        value={formData.stats.wickets}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 text-sm font-bold mb-2">
                        Average
                      </label>
                      <input
                        name="stats.average"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.stats.average}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 text-sm font-bold mb-2">
                        Strike Rate
                      </label>
                      <input
                        name="stats.strikeRate"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.stats.strikeRate}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingPlayer(null);
                      setImagePreview(null);
                      setSelectedImage(null);
                    }}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{editingPlayer ? 'Updating...' : 'Creating...'}</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        <span>{editingPlayer ? 'Update Player' : 'Add Player'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlayersTab;