import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, DollarSign, Users } from 'lucide-react'

const PurchasedPlayersDisplay = ({ teams, isActive = true }) => {
  const [activeTeamIndex, setActiveTeamIndex] = useState(0)
  const teamArray = Object.values(teams || {}).filter(team => team.players && team.players.length > 0)

  useEffect(() => {
    if (!isActive || teamArray.length === 0) return

    const interval = setInterval(() => {
      setActiveTeamIndex((prevIndex) => (prevIndex + 1) % teamArray.length)
    }, 7000)

    return () => clearInterval(interval)
  }, [teamArray.length, isActive])

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  if (teamArray.length === 0) {
    return (
      <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30 h-full shadow-xl">
        <h2 className="text-lg font-bold text-blue-400 mb-4 flex items-center">
          <Trophy className="h-6 w-6 mr-3" />
          Purchased Players
        </h2>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <p>No players purchased yet</p>
          </div>
        </div>
      </div>
    )
  }

  const activeTeam = teamArray[activeTeamIndex]
  const totalSpent = activeTeam.players.reduce((sum, player) => sum + (player.finalPrice || 0), 0)

  return (
    <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30 h-full shadow-xl">
      <h2 className="text-lg font-bold text-blue-400 mb-6 flex items-center">
        <Trophy className="h-6 w-6 mr-3" />
        Purchased Players
      </h2>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTeamIndex}
          initial={{ opacity: 0, x: 50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -50, scale: 0.9 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="space-y-4"
        >
          {/* Team Header */}
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-4 border border-purple-500/20">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">
                {activeTeam.name}
              </h3>
              <div className="flex justify-center items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  <span className="text-gray-300">
                    {activeTeam.players.length} Players
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  <span className="text-gray-300">
                    {formatCurrency(totalSpent)} Spent
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Players List */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {activeTeam.players.map((player, index) => (
              <motion.div
                key={player._id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/70 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {player.image ? (
                      <img
                        src={player.image}
                        alt={player.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/30"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Star className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white text-base">{player.name}</p>
                      <p className="text-sm text-gray-400">{player.role} • {player.country}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-400 text-base">
                      {formatCurrency(player.finalPrice || 0)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Base: {formatCurrency(player.basePrice || 0)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Team Summary */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-medium">Total Investment</span>
              <span className="text-xl font-bold text-green-400">
                {formatCurrency(totalSpent)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-400 text-sm">Remaining Budget</span>
              <span className="text-base font-semibold text-blue-400">
                {formatCurrency(activeTeam.purse || 0)}
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress Indicator */}
      <div className="mt-6 flex justify-center space-x-2">
        {teamArray.map((_, index) => (
          <motion.div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === activeTeamIndex ? 'bg-purple-500' : 'bg-gray-600'
            }`}
            animate={{
              scale: index === activeTeamIndex ? 1.5 : 1,
            }}
          />
        ))}
      </div>

      {/* Team Navigation */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400">
          Showing {activeTeamIndex + 1} of {teamArray.length} teams with purchases
        </p>
      </div>
    </div>
  )
}

export default PurchasedPlayersDisplay