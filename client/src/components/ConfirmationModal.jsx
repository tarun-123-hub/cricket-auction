import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'warning', // 'success', 'error', 'warning'
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  playerName = '',
  currentBid = 0,
  isLoading = false
}) => {
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />
      case 'error':
        return <XCircle className="h-16 w-16 text-red-500" />
      default:
        return <AlertTriangle className="h-16 w-16 text-yellow-500" />
    }
  }

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'from-green-900/20 to-green-800/20',
          border: 'border-green-500/30',
          button: 'bg-green-600 hover:bg-green-700'
        }
      case 'error':
        return {
          bg: 'from-red-900/20 to-red-800/20',
          border: 'border-red-500/30',
          button: 'bg-red-600 hover:bg-red-700'
        }
      default:
        return {
          bg: 'from-yellow-900/20 to-yellow-800/20',
          border: 'border-yellow-500/30',
          button: 'bg-yellow-600 hover:bg-yellow-700'
        }
    }
  }

  const colors = getColors()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`bg-gradient-to-br ${colors.bg} backdrop-blur-xl border ${colors.border} rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              >
                {getIcon()}
              </motion.div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white text-center mb-4">
              {title}
            </h2>

            {/* Player Info */}
            {playerName && (
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700">
                <div className="text-center">
                  <p className="text-lg font-semibold text-white mb-2">{playerName}</p>
                  {currentBid > 0 && (
                    <p className="text-xl font-bold text-green-400">
                      Final Bid: {formatCurrency(currentBid)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Message */}
            <p className="text-gray-300 text-center mb-8 leading-relaxed">
              {message}
            </p>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 px-6 py-3 ${colors.button} text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{confirmText}</span>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ConfirmationModal