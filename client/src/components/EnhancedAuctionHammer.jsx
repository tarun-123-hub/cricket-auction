import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gavel, Sparkles, Trophy, X } from 'lucide-react'

const EnhancedAuctionHammer = ({ 
  isVisible, 
  result, // 'sold' or 'unsold'
  playerImage,
  playerName,
  finalPrice,
  soldTo,
  onAnimationComplete 
}) => {
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  const hammerVariants = {
    initial: { 
      y: -300, 
      rotate: -45,
      scale: 0.3,
      opacity: 0
    },
    animate: { 
      y: [0, -50, 0, -20, 0],
      rotate: [-45, -90, -45, -60, -45],
      scale: [0.3, 1.5, 1.2, 1.1, 1],
      opacity: 1,
      transition: {
        duration: 2,
        ease: "easeInOut",
        times: [0, 0.3, 0.5, 0.7, 1]
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.5,
      y: -100,
      transition: { duration: 0.8 }
    }
  }

  const impactVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: [0, 2, 1.5, 0],
      opacity: [0, 1, 0.8, 0],
      transition: {
        duration: 1.5,
        delay: 1.2,
        ease: "easeOut"
      }
    }
  }

  const textVariants = {
    initial: { 
      scale: 0,
      opacity: 0,
      y: 50
    },
    animate: { 
      scale: [0, 1.4, 1],
      opacity: 1,
      y: 0,
      transition: {
        delay: 1.8,
        duration: 0.8,
        ease: "backOut"
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.8,
      y: -30
    }
  }

  const sparkleVariants = {
    initial: { scale: 0, opacity: 0, rotate: 0 },
    animate: { 
      scale: [0, 1.5, 1, 0],
      opacity: [0, 1, 0.8, 0],
      rotate: [0, 180, 360],
      transition: {
        duration: 3,
        repeat: 2,
        ease: "easeInOut",
        delay: 1
      }
    }
  }

  const playerImageVariants = {
    initial: { scale: 1, filter: 'brightness(1)' },
    impact: {
      scale: [1, 0.95, 1.05, 1],
      filter: ['brightness(1)', 'brightness(0.7)', 'brightness(1.2)', 'brightness(1)'],
      transition: {
        duration: 0.6,
        delay: 1.2,
        ease: "easeInOut"
      }
    }
  }

  const overlayVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: [0, 0.3, 0.1, 0],
      transition: {
        duration: 1.5,
        delay: 1.2,
        ease: "easeInOut"
      }
    }
  }

  return (
    <AnimatePresence onExitComplete={onAnimationComplete}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 overflow-hidden"
        >
          {/* Player Image with Impact Effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              variants={playerImageVariants}
              initial="initial"
              animate="impact"
              className="relative"
            >
              <img
                src={playerImage || 'https://via.placeholder.com/400'}
                alt={playerName}
                className="max-h-96 max-w-96 object-cover rounded-2xl shadow-2xl"
              />
              
              {/* Impact Overlay */}
              <motion.div
                variants={overlayVariants}
                initial="initial"
                animate="animate"
                className={`absolute inset-0 rounded-2xl ${
                  result === 'sold' ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
            </motion.div>
          </div>

          {/* Sparkle Effects for Sold */}
          {result === 'sold' && (
            <>
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  variants={sparkleVariants}
                  initial="initial"
                  animate="animate"
                  className="absolute"
                  style={{
                    top: `${15 + Math.random() * 70}%`,
                    left: `${15 + Math.random() * 70}%`,
                  }}
                >
                  <Sparkles className="h-8 w-8 text-yellow-400" />
                </motion.div>
              ))}
            </>
          )}

          {/* 3D Hammer Animation */}
          <motion.div
            variants={hammerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute z-10"
            style={{
              filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.8))',
            }}
          >
            <div className="relative">
              <Gavel className="h-40 w-40 text-yellow-400" />
              
              {/* Hammer Glow Effect */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: 1.2
                }}
                className="absolute inset-0 h-40 w-40 bg-yellow-400/30 rounded-full blur-xl"
              />
            </div>
          </motion.div>

          {/* Impact Effect */}
          <motion.div
            variants={impactVariants}
            initial="initial"
            animate="animate"
            className="absolute z-5"
          >
            <div className={`w-32 h-32 rounded-full border-8 ${
              result === 'sold' ? 'border-green-400' : 'border-red-500'
            }`} />
          </motion.div>

          {/* Result Text and Details */}
          <motion.div
            variants={textVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center z-20"
          >
            <div className={`mb-6 ${
              result === 'sold' 
                ? 'text-green-400 border-green-400 bg-green-900/40' 
                : 'text-red-500 border-red-500 bg-red-900/40'
            } border-4 px-12 py-6 rounded-2xl backdrop-blur-lg shadow-2xl`}>
              <div className="text-7xl font-extrabold tracking-wider mb-4">
                {result === 'sold' ? 'SOLD!' : 'UNSOLD'}
              </div>
              
              {result === 'sold' && (
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-white">
                    {playerName}
                  </div>
                  <div className="text-3xl font-bold text-yellow-400">
                    {formatCurrency(finalPrice)}
                  </div>
                  <div className="text-xl font-semibold text-blue-300">
                    to {soldTo}
                  </div>
                </div>
              )}
              
              {result === 'unsold' && (
                <div className="text-2xl font-bold text-white mt-4">
                  {playerName}
                </div>
              )}
            </div>
            
            {result === 'sold' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.5 }}
                className="flex items-center justify-center space-x-3 text-2xl font-semibold text-yellow-400"
              >
                <Trophy className="h-8 w-8" />
                <span>Congratulations!</span>
                <Trophy className="h-8 w-8" />
              </motion.div>
            )}
          </motion.div>

          {/* Sound Wave Effect */}
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ 
              scale: [0, 4, 6],
              opacity: [0.8, 0.3, 0]
            }}
            transition={{ 
              duration: 2.5,
              delay: 1.2,
              ease: "easeOut"
            }}
            className={`absolute inset-0 border-4 ${
              result === 'sold' ? 'border-green-400' : 'border-red-500'
            } rounded-full`}
          />

          {/* Secondary Wave */}
          <motion.div
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ 
              scale: [0, 5, 7],
              opacity: [0.6, 0.2, 0]
            }}
            transition={{ 
              duration: 3,
              delay: 1.5,
              ease: "easeOut"
            }}
            className={`absolute inset-0 border-2 ${
              result === 'sold' ? 'border-green-400' : 'border-red-500'
            } rounded-full`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default EnhancedAuctionHammer