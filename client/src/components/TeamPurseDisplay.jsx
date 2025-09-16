import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Users, TrendingDown, TrendingUp } from 'lucide-react'

const TeamPurseDisplay = ({ teams, isActive = true }) => {
  const [activeTeamIndex, setActiveTeamIndex] = useState(0)
  const teamArray = Object.values(teams || {}).filter(team => team.name && team.purse !== undefined)

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
          <Wallet className="h-6 w-6 mr-3" />
          Team Purses
        </h2>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>No teams available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30 h-full shadow-xl">
      <h2 className="text-lg font-bold text-blue-400 mb-6 flex items-center">
        <Wallet className="h-6 w-6 mr-3" />
        Available Purse
      </h2>

      <div className="space-y-4 mb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTeamIndex}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.9 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-6 border border-blue-500/20"
          >
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-3">
                {teamArray[activeTeamIndex]?.name}
              </h3>
              
              <div className="mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="text-3xl font-bold text-green-400 mb-2"
                >
                  {formatCurrency(teamArray[activeTeamIndex]?.purse || 0)}
                </motion.div>
                <p className="text-gray-300 text-base">Remaining Budget</p>
              </div>

              <div className="flex justify-center items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  <span className="text-gray-300">
                    {teamArray[activeTeamIndex]?.players?.length || 0} Players
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-5 w-5 text-red-400" />
                  <span className="text-gray-300">
                    {formatCurrency((teamArray[activeTeamIndex]?.originalPurse || 10000000) - (teamArray[activeTeamIndex]?.purse || 0))} Spent
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* All Teams Summary */}
      <div className="space-y-3">
        <h4 className="text-base font-semibold text-gray-300 mb-3">All Teams</h4>
        {teamArray.map((team, index) => (
          <motion.div
            key={team.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex justify-between items-center p-3 rounded-lg transition-all duration-300 ${
              index === activeTeamIndex 
                ? 'bg-blue-600/30 border border-blue-500/50' 
                : 'bg-gray-800/50 hover:bg-gray-700/50'
            }`}
          >
            <div>
              <p className="font-semibold text-white text-sm">{team.name}</p>
              <p className="text-xs text-gray-400">{team.players?.length || 0} players</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-400 text-sm">
                {formatCurrency(team.purse || 0)}
              </p>
              <p className="text-xs text-gray-400">
                {formatCurrency((team.originalPurse || 10000000) - (team.purse || 0))} spent
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress Indicator */}
      <div className="mt-6 flex justify-center space-x-2">
        {teamArray.map((_, index) => (
          <motion.div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === activeTeamIndex ? 'bg-blue-500' : 'bg-gray-600'
            }`}
            animate={{
              scale: index === activeTeamIndex ? 1.5 : 1,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default TeamPurseDisplay