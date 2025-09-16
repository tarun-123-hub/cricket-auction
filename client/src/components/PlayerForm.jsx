import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { createPlayer, updatePlayer } from '../store/slices/playersSlice';
import { X } from 'lucide-react';

const PlayerForm = ({ player, onClose, isOpen }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    country: '',
    role: 'Batsman',
    battingStyle: 'Right-handed',
    bowlingStyle: 'None',
    basePrice: 100000,
    image: null,
    previewUrl: ''
  });

  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name || '',
        age: player.age || '',
        country: player.country || '',
        role: player.role || 'Batsman',
        battingStyle: player.battingStyle || 'Right-handed',
        bowlingStyle: player.bowlingStyle || 'None',
        basePrice: player.basePrice || 100000,
        image: null,
        previewUrl: player.image ? `http://localhost:5001/uploads/players/${player.image.split('/').pop()}` : ''
      });
    }
  }, [player]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'basePrice' || name === 'age' ? parseInt(value) || 0 : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file,
        previewUrl: URL.createObjectURL(file)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const playerData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'previewUrl') {
          if (key === 'image' && formData[key] === null) {
            // Do not append if image is null
          } else {
            playerData.append(key, formData[key]);
          }
        }
      });
      
      if (player) {
        await dispatch(updatePlayer({ id: player._id, playerData })).unwrap();
        toast.success('Player updated successfully');
      } else {
        await dispatch(createPlayer(playerData)).unwrap();
        toast.success('Player added successfully');
      }
      
      onClose();
    } catch (error) {
      toast.error(error || 'Failed to save player');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              {player ? 'Edit Player' : 'Add New Player'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="name">
                  Player Name
                </label>
                <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="age">
                  Age
                </label>
                <input id="age" name="age" type="number" value={formData.age} onChange={handleChange} className="input-field" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="country">
                  Country
                </label>
                <input id="country" name="country" type="text" value={formData.country} onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="role">
                  Role
                </label>
                <select id="role" name="role" value={formData.role} onChange={handleChange} className="input-field">
                  <option>Batsman</option>
                  <option>Bowler</option>
                  <option>All-rounder</option>
                  <option>Wicket-keeper</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="battingStyle">
                  Batting Style
                </label>
                <select id="battingStyle" name="battingStyle" value={formData.battingStyle} onChange={handleChange} className="input-field">
                  <option>Right-handed</option>
                  <option>Left-handed</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="bowlingStyle">
                  Bowling Style
                </label>
                <select id="bowlingStyle" name="bowlingStyle" value={formData.bowlingStyle} onChange={handleChange} className="input-field">
                  <option>None</option>
                  <option>Right-arm fast</option>
                  <option>Left-arm fast</option>
                  <option>Right-arm medium</option>
                  <option>Left-arm medium</option>
                  <option>Right-arm off-spin</option>
                  <option>Left-arm orthodox</option>
                  <option>Right-arm leg-spin</option>
                  <option>Left-arm chinaman</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="basePrice">
                Base Price (₹)
              </label>
              <input id="basePrice" name="basePrice" type="number" min="100000" step="50000" value={formData.basePrice} onChange={handleChange} className="input-field" required />
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">Player Image</label>
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-600">
                  {formData.previewUrl ? (
                    <img src={formData.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-500 text-4xl">?</span>
                  )}
                </div>
                <div>
                  <input id="image" name="image" type="file" accept="image/*" onChange={handleImageChange} className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 transition" />
                  <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 pt-4">
              <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200">
                Cancel
              </button>
              <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200">
                {player ? 'Update Player' : 'Add Player'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PlayerForm;