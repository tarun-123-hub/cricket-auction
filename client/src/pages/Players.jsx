import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  Edit, 
  Trash2, 
  X, 
  Save, 
  Camera, 
  Star,
  Users,
  Trophy,
  DollarSign,
  MapPin,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const { user } = useSelector((state) => state.auth);
  
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

  const roles = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper', 'Captain'];
  const countries = ['India', 'Australia', 'England', 'South Africa', 'New Zealand', 'Pakistan', 'Sri Lanka', 'Bangladesh', 'West Indies', 'Afghanistan'];
  const battingStyles = ['Right-handed', 'Left-handed'];
  const bowlingStyles = ['Right-arm fast', 'Left-arm fast', 'Right-arm medium', 'Left-arm medium', 'Right-arm spin', 'Left-arm spin', 'None'];

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/players');
      setPlayers(response.data);
    } catch (error) {
      toast.error('Failed to fetch players');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setSelectedImage(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setSelectedImage(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadingImage(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Add all player data
      formDataToSend.append('name', formData.name);
      formDataToSend.append('role', formData.role);
      formDataToSend.append('basePrice', formData.basePrice.toString());
      formDataToSend.append('age', formData.age.toString());
      formDataToSend.append('country', formData.country);
      formDataToSend.append('battingStyle', formData.battingStyle);
      formDataToSend.append('bowlingStyle', formData.bowlingStyle);
      formDataToSend.append('stats', JSON.stringify(formData.stats));
      
      // Add image if selected
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      if (editingPlayer) {
        const response = await axios.put(`/players/${editingPlayer._id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setPlayers(prev => prev.map(p => p._id === editingPlayer._id ? response.data.player : p));
        toast.success('Player updated successfully!');
      } else {
        const response = await axios.post('/players', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setPlayers(prev => [...prev, response.data.player]);
        toast.success('Player added successfully!');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving player:', error);
      toast.error(error.response?.data?.message || 'Failed to save player');
    } finally {
      setUploadingImage(false);
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
    setSelectedImage(null);
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

  const resetForm = () => {
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
    setImagePreview(null);
    setSelectedImage(null);
    setEditingPlayer(null);
    setShowCreateForm(false);
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || player.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const getRoleColor = (role) => {
    switch (role) {
      case 'Batsman': return 'from-orange-500 to-red-500';
      case 'Bowler': return 'from-blue-500 to-indigo-500';
      case 'All-rounder': return 'from-purple-500 to-pink-500';
      case 'Wicket-keeper': return 'from-green-500 to-teal-500';
      case 'Captain': return 'from-yellow-500 to-orange-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 text-white pt-16">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-cricket font-bold text-white mb-2 flex items-center">
              <Users className="h-10 w-10 mr-3 text-blue-400" />
              Players Management
            </h1>
            <p className="text-gray-400 text-lg">Manage cricket players with detailed profiles and statistics</p>
          </div>
          
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold flex items-center space-x-3 transition-all duration-200 shadow-lg hover:shadow-xl mt-4 lg:mt-0"
            >
              <Plus className="h-6 w-6" />
              <span>Add New Player</span>
            </button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-gray-700/50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search players by name or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <AnimatePresence>
            {filteredPlayers.map((player, index) => (
              <motion.div
                key={player._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
                  {/* Player Image */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-700 to-gray-800">
                    {player.image ? (
                      <img
                        src={`http://localhost:5001${player.image}`}
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl font-bold text-gray-500">
                          {player.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    
                    {/* Role Badge */}
                    <div className={`absolute top-3 left-3 bg-gradient-to-r ${getRoleColor(player.role)} px-3 py-1 rounded-full text-xs font-semibold text-white shadow-lg`}>
                      {player.role}
                    </div>
                    
                    {/* Admin Actions */}
                    {user?.role === 'admin' && (
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditPlayer(player)}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(player._id)}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Player Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">{player.name}</h3>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-blue-400" />
                        <span>{player.country}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-green-400" />
                        <span>{player.age} years old</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-purple-400" />
                        <span>{player.battingStyle}</span>
                      </div>
                      {player.bowlingStyle !== 'None' && (
                        <div className="flex items-center space-x-2">
                          <Zap className="h-4 w-4 text-yellow-400" />
                          <span>{player.bowlingStyle}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Base Price */}
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Base Price</span>
                        <span className="text-xl font-bold text-green-400">
                          {formatCurrency(player.basePrice)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    {player.stats && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Matches:</span>
                            <span className="text-white">{player.stats.matches}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Runs:</span>
                            <span className="text-white">{player.stats.runs}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Wickets:</span>
                            <span className="text-white">{player.stats.wickets}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Avg:</span>
                            <span className="text-white">{player.stats.average}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredPlayers.length === 0 && !loading && (
          <div className="text-center py-16">
            <Users className="h-24 w-24 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-400 mb-2">No players found</h3>
            <p className="text-gray-500">
              {searchTerm || filterRole !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Add your first player to get started'
              }
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading players...</p>
          </div>
        )}
      </div>

      {/* Player Form Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">
                    {editingPlayer ? 'Edit Player' : 'Add New Player'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Player Image
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors duration-200 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg mx-auto mb-4"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImagePreview(null);
                            setSelectedImage(null);
                          }}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400 mb-2">Click to upload or drag and drop</p>
                        <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Player Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter player name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Base Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter base price"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Age *
                    </label>
                    <input
                      type="number"
                      required
                      min="16"
                      max="50"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter age"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Country *
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {countries.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Batting Style
                    </label>
                    <select
                      value={formData.battingStyle}
                      onChange={(e) => setFormData({ ...formData, battingStyle: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {battingStyles.map(style => (
                        <option key={style} value={style}>{style}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bowling Style
                    </label>
                    <select
                      value={formData.bowlingStyle}
                      onChange={(e) => setFormData({ ...formData, bowlingStyle: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {bowlingStyles.map(style => (
                        <option key={style} value={style}>{style}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Statistics */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Matches
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stats.matches}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          stats: { ...formData.stats, matches: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Runs
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stats.runs}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          stats: { ...formData.stats, runs: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Wickets
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stats.wickets}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          stats: { ...formData.stats, wickets: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Average
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.stats.average}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          stats: { ...formData.stats, average: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Strike Rate
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.stats.strikeRate}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          stats: { ...formData.stats, strikeRate: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingImage}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
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

export default Players;
