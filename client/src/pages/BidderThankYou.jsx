import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Trophy, Heart, Star, Sparkles } from 'lucide-react'

const BidderThankYou = () => {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(5)
  const { user } = useSelector((state) => state.auth)
  const { auctionSummary, teams } = useSelector((state) => state.auction)

  const userTeam = teams[user?.team] || null
  const teamPlayers = userTeam?.players || []
  const totalSpent = teamPlayers.reduce((sum, player) => sum + (player.finalPrice || 0), 0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate])

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/30 to-blue-900/30 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ 
                x: Math.random() * window.innerWidth,
                y: window.innerHeight + 100,
                rotate: 0,
                opacity: 0
              }}
              animate={{ 
                y: -100,
                rotate: 360,
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "linear"
              }}
            >
              <Sparkles className="h-6 w-6 text-yellow-400" />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-purple-500/30 shadow-2xl text-center"
        >
          {/* Trophy Animation */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-8"
          >
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              <Trophy className="h-24 w-24 text-yellow-500 mx-auto" />
            </motion.div>
          </motion.div>

          {/* Thank You Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-6xl font-cricket font-bold text-white mb-4">
              Thank You!
            </h1>
            <p className="text-2xl text-purple-300 mb-6">
              {user?.username}, you've been an amazing participant!
            </p>
            <div className="flex items-center justify-center space-x-2 text-pink-400">
              <Heart className="h-6 w-6" />
              <span className="text-lg">We appreciate your participation in</span>
              <Heart className="h-6 w-6" />
            </div>
            <p className="text-3xl font-bold text-blue-400 mt-2">
              {auctionSummary?.eventName || 'Namma Cricket Auction'}
            </p>
          </motion.div>

          {/* Team Summary */}
          {userTeam && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-2xl p-6 mb-8 border border-blue-500/30"
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center justify-center">
                <Star className="h-6 w-6 mr-2 text-yellow-400" />
                Your Team Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-gray-300">Players Acquired</p>
                  <p className="text-3xl font-bold text-green-400">{teamPlayers.length}</p>
                </div>
                <div>
                  <p className="text-gray-300">Total Investment</p>
                  <p className="text-2xl font-bold text-yellow-400">{formatCurrency(totalSpent)}</p>
                </div>
                <div>
                  <p className="text-gray-300">Remaining Budget</p>
                  <p className="text-2xl font-bold text-blue-400">{formatCurrency(userTeam.purse)}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Motivational Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mb-8"
          >
            <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/30">
              <p className="text-lg text-gray-300 mb-4">
                "Cricket is not just a game, it's a passion that brings us all together!"
              </p>
              <p className="text-blue-300 font-semibold">
                Thank you for making this auction exciting and memorable! 🏏
              </p>
            </div>
          </motion.div>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="mb-6"
          >
            <p className="text-gray-400 mb-4">Redirecting to dashboard in</p>
            <motion.div
              key={countdown}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-6xl font-bold text-white bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent"
            >
              {countdown}
            </motion.div>
          </motion.div>

          {/* Footer Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.6 }}
            className="text-gray-400"
          >
            <p>See you in the next auction! 🎉</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default BidderThankYou