import React, { useState } from 'react';
import socket from '../utils/socket';
import { toast } from 'react-toastify';
import { Play, Square, Check, X, SkipForward, ShieldCheck } from 'lucide-react';

const AuctionControls = ({ 
  auctionState, 
  onStartAuction, 
  onStartNextPlayer, 
  onEndAuction, 
  onActivateEvent 
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionData, setActionData] = useState(null);

  const handleStartAuction = (player) => {
    setSelectedPlayer(player);
    setActionType('start');
    setActionData(player);
    setShowConfirmation(true);
  };

  const handleEndAuction = (result) => {
    setActionType('end');
    setActionData(result);
    setShowConfirmation(true);
  };

  const confirmAction = () => {
    if (actionType === 'start') {
      onStartAuction(actionData);
      toast.success(`Auction started for ${actionData.name}`);
    } else if (actionType === 'end') {
      onEndAuction(actionData);
      toast.success(`Auction ended. Player ${actionData.sold ? 'sold' : 'unsold'}.`);
    } else if (actionType === 'next') {
      onStartNextPlayer();
      toast.success('Starting next player');
    }
    
    setShowConfirmation(false);
    setSelectedPlayer(null);
    setActionType('');
    setActionData(null);
  };

  const cancelAction = () => {
    setShowConfirmation(false);
    setSelectedPlayer(null);
    setActionType('');
    setActionData(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-white">Auction Controls</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
            <h3 className="font-semibold text-blue-400">Event Status</h3>
            <div className="mt-2 space-y-2 text-sm text-gray-300">
              <p><span className="font-medium text-gray-400">Event:</span> {auctionState.eventName || 'No active event'}</p>
              <p className="flex items-center"><span className="font-medium text-gray-400">Status:</span> 
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  auctionState.isEventLive ? 'bg-green-500/20 text-green-300' : 
                  auctionState.isEventComplete ? 'bg-gray-500/20 text-gray-300' : 
                  'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {auctionState.isEventLive ? 'Live' : 
                   auctionState.isEventComplete ? 'Completed' : 
                   'Not Started'}
                </span>
              </p>
              <p><span className="font-medium text-gray-400">Players:</span> {auctionState.eventPlayers.length}</p>
              <p><span className="font-medium text-gray-400">Teams:</span> {auctionState.registeredBidders.length}</p>
            </div>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
            <h3 className="font-semibold text-purple-400">Current Auction</h3>
            <div className="mt-2 space-y-2 text-sm text-gray-300">
              <p className="flex items-center"><span className="font-medium text-gray-400">Status:</span> 
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  auctionState.isActive ? 'bg-green-500/20 text-green-300' : 
                  'bg-red-500/20 text-red-300'
                }`}>
                  {auctionState.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
              <p><span className="font-medium text-gray-400">Current Player:</span> {auctionState.currentPlayer ? auctionState.currentPlayer.name : 'None'}</p>
              <p><span className="font-medium text-gray-400">Current Bid:</span> ₹{auctionState.currentBid}</p>
              <p><span className="font-medium text-gray-400">Timer:</span> {auctionState.timer}s</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          {!auctionState.isEventLive && !auctionState.isEventComplete && (
            <button
              onClick={onActivateEvent}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-semibold flex items-center space-x-2 transition-colors duration-200"
            >
              <ShieldCheck className="h-5 w-5" />
              <span>Activate Event</span>
            </button>
          )}
          
          {auctionState.isEventLive && !auctionState.isActive && auctionState.remainingPlayers.length > 0 && (
            <button
              onClick={() => handleStartAuction(auctionState.remainingPlayers[0])}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold flex items-center space-x-2 transition-colors duration-200"
            >
              <Play className="h-5 w-5" />
              <span>Start Auction</span>
            </button>
          )}
          
          {auctionState.isActive && (
            <>
              <button
                onClick={() => handleEndAuction({ sold: false })}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold flex items-center space-x-2 transition-colors duration-200"
              >
                <X className="h-5 w-5" />
                <span>Mark as Unsold</span>
              </button>
              
              <button
                onClick={() => handleEndAuction({ sold: true })}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-semibold flex items-center space-x-2 transition-colors duration-200"
              >
                <Check className="h-5 w-5" />
                <span>Confirm Sale</span>
              </button>
            </>
          )}
          
          {!auctionState.isActive && auctionState.isEventLive && auctionState.remainingPlayers.length > 0 && (
            <button
              onClick={() => {
                setActionType('next');
                setShowConfirmation(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-semibold flex items-center space-x-2 transition-colors duration-200"
            >
              <SkipForward className="h-5 w-5" />
              <span>Next Player</span>
            </button>
          )}
        </div>
      </div>
      
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4 text-white">Confirm Action</h3>
              
              <div className="mb-6 text-gray-300">
                {actionType === 'start' && actionData && (
                  <p>Are you sure you want to start the auction for <span className="font-semibold text-yellow-400">{actionData.name}</span> with a base price of ₹{actionData.basePrice}?</p>
                )}
                
                {actionType === 'end' && actionData && (
                  <p>Are you sure you want to end the auction and mark the player as <span className="font-semibold text-yellow-400">{actionData.sold ? 'sold' : 'unsold'}</span>?</p>
                )}
                
                {actionType === 'next' && (
                  <p>Are you sure you want to move to the next player?</p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelAction}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionControls;
