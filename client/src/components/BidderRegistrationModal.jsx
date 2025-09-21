import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, User, Users, Trophy } from 'lucide-react'
import axios from '../api/axios'
import toast from 'react-hot-toast'
import LoadingSpinner from './LoadingSpinner'

const BidderRegistrationModal = ({ isOpen, onClose, onSuccess, liveEvent }) => {
  const [formData, setFormData] = useState({
    teamName: '',
    ownerName: ''
  })
  const [teamImage, setTeamImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB')
        return
      }
      
      setTeamImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.teamName.trim() || !formData.ownerName.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    
    try {
      const submitData = new FormData()
      submitData.append('teamName', formData.teamName.trim())
      submitData.append('ownerName', formData.ownerName.trim())
      
      if (teamImage) {
        submitData.append('teamImage', teamImage)
      }

      await axios.post('/auction-event/register', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      toast.success('Successfully registered for auction!')
      
      // Reset form
      setFormData({ teamName: '', ownerName: '' })
      setTeamImage(null)
      setImagePreview(null)
      
      onSuccess()
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ teamName: '', ownerName: '' })
      setTeamImage(null)
      setImagePreview(null)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-gray-800/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <h2 className="text-xl font-bold text-white">Register for Auction</h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="text-gray-400 hover:text-white transition-colors duration-200 disabled:opacity-50"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Event Info */}
            {liveEvent && (
              <div className="bg-green-900/30 rounded-lg p-4 mb-6 border border-green-500/20">
                <h3 className="text-green-300 font-semibold text-base mb-1">{liveEvent.eventName}</h3>
                <p className="text-gray-300 text-sm">
                  {liveEvent.registeredBidders.length}/{liveEvent.maxBidders} spots filled
                </p>
                {liveEvent.registeredBidders.length >= liveEvent.maxBidders && (
                  <p className="text-red-300 text-sm mt-2 font-semibold">
                    ⚠️ Registration Full - No more spots available
                  </p>
                )}
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {liveEvent && liveEvent.registeredBidders.length >= liveEvent.maxBidders ? (
                <div className="text-center py-8">
                  <p className="text-red-400 text-lg font-semibold mb-2">Registration Closed</p>
                  <p className="text-gray-400">This event has reached maximum capacity.</p>
                </div>
              ) : (
                <>
              {/* Team Name */}
              <div>
                <label htmlFor="teamName" className="block text-sm font-medium text-gray-300 mb-2">
                  Team Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="teamName"
                    name="teamName"
                    type="text"
                    required
                    value={formData.teamName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                    placeholder="Enter your team name"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Owner Name */}
              <div>
                <label htmlFor="ownerName" className="block text-sm font-medium text-gray-300 mb-2">
                  Owner Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="ownerName"
                    name="ownerName"
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                    placeholder="Enter owner name"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Team Image */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team Logo (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="flex items-center justify-center w-full h-12 px-4 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors duration-200">
                      <Upload className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-400">
                        {teamImage ? teamImage.name : 'Choose image'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={isLoading}
                      />
                    </label>
                  </div>
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Team preview"
                      className="w-12 h-12 rounded-lg object-cover border border-gray-600"
                    />
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Max size: 5MB. Formats: JPG, PNG, GIF</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !formData.teamName.trim() || !formData.ownerName.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-base shadow-lg"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <Trophy className="h-4 w-4" />
                    <span>Register Team</span>
                  </>
                )}
              </button>
                </>
              )}
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                Registration is required to participate in bidding
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default BidderRegistrationModal