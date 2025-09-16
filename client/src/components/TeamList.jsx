import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateBidderPurse } from '../store/slices/auctionEventSlice';
import { DollarSign, Save } from 'lucide-react';

const TeamList = ({ registeredBidders }) => {
  const dispatch = useDispatch();
  const [purseAmounts, setPurseAmounts] = useState({});

  const handlePurseChange = (bidderId, amount) => {
    setPurseAmounts(prev => ({ ...prev, [bidderId]: amount }));
  };

  const handleSavePurse = (bidderId) => {
    const purse = parseInt(purseAmounts[bidderId], 10);
    if (!isNaN(purse)) {
      dispatch(updateBidderPurse({ bidderId, purse }));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Registered Teams</h2>
      
      {!registeredBidders || registeredBidders.length === 0 ? (
        <div className="text-center py-8 bg-gray-800 rounded-lg">
          <p className="text-gray-400">No teams registered for the live event yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {registeredBidders.map((bidder) => (
            <div key={bidder._id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
              <div className="p-5">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden mr-4 border-2 border-purple-500">
                    {bidder.teamImage ? (
                      <img 
                        src={`http://localhost:5001${bidder.teamImage}`} 
                        alt={bidder.teamName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-purple-400 text-2xl font-bold">{bidder.teamName.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{bidder.teamName}</h3>
                    <p className="text-gray-400 text-sm">{bidder.ownerName}</p>
                  </div>
                </div>
                
                <div className="bg-gray-700 p-3 rounded-lg mb-4">
                  <p className="text-sm text-gray-400">Current Purse</p>
                  <p className="font-bold text-2xl text-green-400">₹{bidder.purse.toLocaleString()}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Set New Purse Amount</label>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-grow">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        value={purseAmounts[bidder._id] || ''}
                        onChange={(e) => handlePurseChange(bidder._id, e.target.value)}
                        className="bg-gray-900 border border-gray-600 rounded-md w-full pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                        placeholder="Enter amount"
                      />
                    </div>
                    <button
                      onClick={() => handleSavePurse(bidder._id)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-semibold flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50"
                      disabled={!purseAmounts[bidder._id]}
                    >
                      <Save className="h-4 w-4" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamList;
