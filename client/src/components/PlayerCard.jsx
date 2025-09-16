import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const PlayerCard = ({ player, isAdmin = false, onDelete, onEdit }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'sold': return 'text-green-400';
      case 'unsold': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:shadow-purple-500/20 hover:-translate-y-1 border border-gray-700">
      <div className="p-5">
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden mr-4 border-2 border-purple-500">
            {player.image ? (
              <img 
                src={player.image ? `http://localhost:5001/uploads/players/${player.image.split('/').pop()}` : undefined} 
                alt={player.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-purple-400 text-2xl font-bold">{player.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{player.name}</h3>
            <p className="text-gray-400 text-sm">{player.role} • {player.age} yrs • {player.country}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-700 p-3 rounded-lg">
            <p className="text-xs text-gray-400">Base Price</p>
            <p className="font-semibold text-base text-green-400">₹{player.basePrice.toLocaleString()}</p>
          </div>
          <div className="bg-gray-700 p-3 rounded-lg">
            <p className="text-xs text-gray-400">Status</p>
            <p className={`font-semibold text-base ${getStatusColor(player.auctionStatus)}`}>
              {player.auctionStatus || 'pending'}
            </p>
          </div>
          <div className="bg-gray-700 p-3 rounded-lg">
            <p className="text-xs text-gray-400">Batting Style</p>
            <p className="font-semibold text-base text-white">{player.battingStyle}</p>
          </div>
          <div className="bg-gray-700 p-3 rounded-lg">
            <p className="text-xs text-gray-400">Bowling Style</p>
            <p className="font-semibold text-base text-white">{player.bowlingStyle || 'N/A'}</p>
          </div>
        </div>
        
        {player.auctionStatus === 'sold' && (
          <div className="mb-4 bg-blue-900/30 p-3 rounded-lg border border-blue-500/50">
            <p className="text-xs text-blue-300">Sold To</p>
            <p className="font-semibold text-white">{player.soldTo}</p>
            <p className="text-sm text-gray-300">Final Price: ₹{player.finalPrice.toLocaleString()}</p>
          </div>
        )}
        
        {isAdmin && (
          <div className="flex space-x-3 mt-4">
            <button
              onClick={() => onEdit(player)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-semibold flex items-center justify-center space-x-2 transition-colors duration-200"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => onDelete(player._id)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-semibold flex items-center justify-center space-x-2 transition-colors duration-200"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;