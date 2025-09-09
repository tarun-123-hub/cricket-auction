import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gavel } from 'lucide-react'

const AuctionHammer = ({ 
  isVisible, 
  result, // 'sold' or 'unsold'
  onAnimationComplete 
}) => {
  const hammerVariants = {
    initial: { 
      y: -200, 
      rotate: -45,
      scale: 0.5,
      opacity: 0
    },
    animate: { 
      y: 0, 
      rotate: [0, -45, 0, -30, 0],
      scale: [0.5, 1.2, 1],
      opacity: 1,
      transition: {
        duration: 1.5,
        rotate: {
          duration: 1,
          ease: "easeInOut",
          times: [0, 0.3, 0.5, 0.7, 1]
        },
        scale: {
          duration: 0.8,
          ease: "easeOut"
        }
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.5 }
    }
  }

  const textVariants = {
    initial: { 
      scale: 0,
      opacity: 0
    },
    animate: { 
      scale: [0, 1.3, 1],
      opacity: 1,
      transition: {
        delay: 1.2,
        duration: 0.6,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.8
    }
  }

  const sparkleVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: [0, 1, 0],
      opacity: [0, 1, 0],
      transition: {
        duration: 2,
        repeat: 3,
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
          className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10"
        >
          {/* Sparkle Effects */}
          {result === 'sold' && (
            <>
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  variants={sparkleVariants}
                  initial="initial"
                  animate="animate"
                  className="absolute w-4 h-4 bg-yellow-400 rounded-full"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${20 + Math.random() * 60}%`,
                  }}
                />
              ))}
            </>
          )}

          {/* Hammer Animation */}
          <motion.div
            variants={hammerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="mb-8"
          >
            <Gavel className="h-32 w-32 text-yellow-400 drop-shadow-2xl" />
          </motion.div>

          {/* Result Text */}
          <motion.div
            variants={textVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`text-center ${
              result === 'sold' 
                ? 'text-green-400 border-green-400' 
                : 'text-red-500 border-red-500'
            }`}
          >
            <div className={`text-8xl font-extrabold tracking-wider border-4 px-8 py-4 rounded-xl backdrop-blur-sm ${
              result === 'sold' 
                ? 'bg-green-900/30 border-green-400 shadow-green-400/50' 
                : 'bg-red-900/30 border-red-500 shadow-red-500/50'
            } shadow-2xl`}>
              {result === 'sold' ? 'SOLD!' : 'UNSOLD'}
            </div>
            
            {result === 'sold' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8 }}
                className="mt-4 text-2xl font-semibold text-yellow-400"
              >
                🎉 Congratulations! 🎉
              </motion.div>
            )}
          </motion.div>

          {/* Sound Wave Effect for Sold */}
          {result === 'sold' && (
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ 
                scale: [0, 3, 5],
                opacity: [0.8, 0.3, 0]
              }}
              transition={{ 
                duration: 2,
                delay: 1,
                ease: "easeOut"
              }}
              className="absolute inset-0 border-4 border-green-400 rounded-full"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AuctionHammer