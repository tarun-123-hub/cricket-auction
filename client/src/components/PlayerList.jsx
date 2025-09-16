import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { fetchPlayers, deletePlayer } from '../store/slices/playersSlice';
import PlayerForm from './PlayerForm';
import PlayerCard from './PlayerCard';
import { Plus } from 'lucide-react';

const PlayerList = ({ isAdmin = false }) => {
  const dispatch = useDispatch();
  const { players, loading, error } = useSelector((state) => state.players);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);

  useEffect(() => {
    dispatch(fetchPlayers());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleDeletePlayer = async (playerId) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      try {
        await dispatch(deletePlayer(playerId)).unwrap();
        toast.success('Player deleted successfully');
      } catch (err) {
        toast.error(err || 'Failed to delete player');
      }
    }
  };

  const handleEditPlayer = (player) => {
    setEditingPlayer(player);
    setShowAddForm(true);
  };

  const handleFormClose = () => {
    setShowAddForm(false);
    setEditingPlayer(null);
  };

  return (
    <div className="space-y-6 bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Players</h2>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-semibold flex items-center space-x-2 transition-colors duration-200"
          >
            <Plus className="h-5 w-5" />
            <span>Add Player</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <p className="mt-4 text-gray-400">Loading players...</p>
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-8 bg-gray-900 rounded-lg">
          <p className="text-gray-500">No players found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => (
            <PlayerCard
              key={player._id}
              player={player}
              isAdmin={isAdmin}
              onDelete={handleDeletePlayer}
              onEdit={handleEditPlayer}
            />
          ))}
        </div>
      )}

      {showAddForm && (
        <PlayerForm
          player={editingPlayer}
          onClose={handleFormClose}
          isOpen={showAddForm}
        />
      )}
    </div>
  );
};

export default PlayerList;
