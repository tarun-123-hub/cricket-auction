import React, { useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Gavel, 
  Timer, 
  DollarSign, 
  Users, 
  Send, 
  Mic, 
  MicOff,
  Volume2,
  VolumeX,
  Trophy,
  TrendingUp,
  Clock,
  User,
  MessageCircle
} from 'lucide-react'
import { 
  setAuctionState, 
  startAuction, 
  endAuction, 
  newBid, 
  updateTimer, 
  placeBid 
} from '../store/slices/auctionSlice'
import { sendMessage } from '../store/slices/socketSlice'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const AuctionRoom = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { socket, isConnected, messages } = useSelector((state) => state.socket)
  const { 
    isActive, 
    currentPlayer, 
    currentBid, 
    baseBid, 
    timer, 
    bidders,
    lastResult 
  } = useSelector((state) => state.auction)

  const [bidAmount, setBidAmount] = useState('')
  const [chatMessage, setChatMessage] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const [animationType, setAnimationType] = useState('')

  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleAuctionState = (state) => {
      dispatch(setAuctionState(state))
    }

    const handleAuctionStarted = (state) => {
      dispatch(startAuction(state))
      toast.success(`Auction started for ${state.currentPlayer?.name}`)
    }

    const handleAuctionEnded = (data) => {
      dispatch(endAuction(data))
      
      // Show animation
      setAnimationType(data.result.sold ? 'sold' : 'unsold')
      setShowAnimation(true)
      
      setTimeout(() => {
        setShowAnimation(false)
      }, 3000)

      if (data.result.sold) {
        toast.success(`${data.player.name} sold to ${data.result.team} for ₹${currentBid.toLocaleString()}`)
      } else {
        toast.error(`${data.player.name} went unsold`)
      }
    }

    const handleNewBid = (data) => {
      dispatch(newBid(data))
      if (!isMuted) {
        // Play bid sound effect (you can add actual sound here)
        console.log('Bid placed sound')
      }
    }

    const handleTimerUpdate = (time) => {
      dispatch(updateTimer(time))
    }

    const handleBidError = (error) => {
      toast.error(error)
    }

    socket.on('auction-state', handleAuctionState)
    socket.on('auction-started', handleAuctionStarted)
    socket.on('auction-ended', handleAuctionEnded)
    socket.on('new-bid', handleNewBid)
    socket.on('timer-update', handleTimerUpdate)
    socket.on('bid-error', handleBidError)

    return () => {
      socket.off('auction-state', handleAuctionState)
      socket.off('auction-started', handleAuctionStarted)
      socket.off('auction-ended', handleAuctionEnded)
      socket.off('new-bid', handleNewBid)
      socket.off('timer-update', handleTimerUpdate)
      socket.off('bid-error', handleBidError)
    }
  }, [socket, dispatch, currentBid, isMuted])

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Update bid amount when current bid changes
  useEffect(() => {
    if (currentBid > 0) {
      setBidAmount((currentBid + 100000).toString()) // Add 1 lakh increment
    }
  }, [currentBid])

  const handlePlaceBid = (e) => {
    e.preventDefault()
    
    if (!isActive || !currentPlayer) {
      toast.error('No active auction')
      return
    }

    const amount = parseInt(bidAmount)
    if (isNaN(amount) || amount <= currentBid) {
      toast.error('Bid must be higher than current bid')
      return
    }

    dispatch(placeBid(amount))
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (chatMessage.trim()) {
      dispatch(sendMessage(chatMessage.trim()))
      setChatMessage('')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getTimerColor = () => {
    if (timer > 20) return 'text-green-400'
    if (timer > 10) return 'text-yellow-400'
    return 'text-red-400'
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="text-white mt-4">Connecting to auction room...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-cricket font-bold text-white flex items-center">
              <Gavel className="h-10 w-10 mr-3 text-yellow-500" />
              Namma Cricket Auction
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-lg ${isMuted ? 'bg-red-600' : 'bg-green-600'} text-white`}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <div className="text-sm text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Auction Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Player Display */}
            <div className="auction-card">
              {isActive && currentPlayer ? (
                <div className="relative">
                  {/* Player Image and Info */}
                  <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8 p-8">
                    {/* Player Image */}
                    <div className="relative">
                      <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-yellow-500 shadow-2xl">
                        <img
                          src={currentPlayer.image ? `http://localhost:5000${currentPlayer.image}` : 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=400'}
                          alt={currentPlayer.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                        {currentPlayer.role}
                      </div>
                    </div>

                    {/* Player Details */}
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-4xl font-cricket font-bold text-white mb-2">
                        {currentPlayer.name}
                      </h2>
                      
                      {/* Player Stats Bar */}
                      <div className="bg-gray-800 rounded-lg p-4 mb-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <p className="text-gray-400 text-xs">BAT/SEAM</p>
                            <p className="text-white font-semibold">{currentPlayer.battingStyle?.split('-')[0]}/{currentPlayer.bowlingStyle?.split('-')[0] || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">AGE</p>
                            <p className="text-white font-semibold">{currentPlayer.age}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">COUNTRY</p>
                            <p className="text-white font-semibold">{currentPlayer.country}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">PREV TEAM</p>
                            <p className="text-white font-semibold">{currentPlayer.previousTeam || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Bidding Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-900/50 p-4 rounded-lg border border-blue-500">
                          <p className="text-blue-300 text-sm">BASE PRICE</p>
                          <p className="text-2xl font-bold text-white">
                            {formatCurrency(baseBid)}
                          </p>
                        </div>
                        <div className="bg-green-900/50 p-4 rounded-lg border border-green-500">
                          <p className="text-green-300 text-sm">CURRENT BID</p>
                          <p className="text-2xl font-bold text-white">
                            {formatCurrency(currentBid)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="absolute top-4 right-4">
                    <div className={`text-6xl font-bold ${getTimerColor()} bg-black/50 rounded-full w-20 h-20 flex items-center justify-center`}>
                      {timer}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <Gavel className="h-24 w-24 text-gray-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-400 mb-2">
                    No Active Auction
                  </h2>
                  <p className="text-gray-500">
                    Waiting for the next player to be put up for auction...
                  </p>
                </div>
              )}
            </div>

            {/* Bidding Controls */}
            {isActive && currentPlayer && user?.role === 'bidder' && (
              <div className="card">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <DollarSign className="h-6 w-6 mr-2 text-green-500" />
                  Place Your Bid
                </h3>
                <form onSubmit={handlePlaceBid} className="flex space-x-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="Enter bid amount"
                      className="input-field"
                      min={currentBid + 1}
                      step="100000"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-primary px-8 py-3 flex items-center space-x-2"
                  >
                    <Gavel className="h-5 w-5" />
                    <span>Bid</span>
                  </button>
                </form>
                <div className="mt-4 flex space-x-2">
                  {[100000, 500000, 1000000].map((increment) => (
                    <button
                      key={increment}
                      onClick={() => setBidAmount((currentBid + increment).toString())}
                      className="btn-secondary text-sm"
                    >
                      +{formatCurrency(increment)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Bidders */}
            {bidders.length > 0 && (
              <div className="card">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <TrendingUp className="h-6 w-6 mr-2 text-blue-500" />
                  Bidding History
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {bidders.slice(-10).reverse().map((bidder, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-semibold text-white">{bidder.user}</p>
                          <p className="text-sm text-gray-400">{bidder.team}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-400">
                          {formatCurrency(bidder.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(bidder.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chat Sidebar */}
          <div className="card h-fit">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <MessageCircle className="h-6 w-6 mr-2 text-purple-500" />
              Live Chat
            </h3>
            
            {/* Messages */}
            <div 
              ref={chatContainerRef}
              className="h-80 overflow-y-auto mb-4 space-y-2 bg-gray-900 rounded-lg p-3"
            >
              {messages.map((message, index) => (
                <div key={index} className="text-sm">
                  <div className="flex items-start space-x-2">
                    <span className={`font-semibold ${
                      message.role === 'admin' ? 'text-purple-400' :
                      message.role === 'bidder' ? 'text-blue-400' :
                      'text-green-400'
                    }`}>
                      {message.user}:
                    </span>
                    <span className="text-gray-300 flex-1">{message.message}</span>
                  </div>
                  <div className="text-xs text-gray-500 ml-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
                className="input-field flex-1 text-sm"
              />
              <button
                type="submit"
                className="btn-primary p-2"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Sold/Unsold Animation */}
      <AnimatePresence>
        {showAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/80"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: animationType === 'sold' ? [0, 5, -5, 0] : [0, -2, 2, 0]
              }}
              transition={{ duration: 0.5, repeat: 3 }}
              className={`text-8xl font-cricket font-bold p-8 rounded-2xl ${
                animationType === 'sold' 
                  ? 'text-green-400 bg-green-900/50 border-4 border-green-400' 
                  : 'text-red-400 bg-red-900/50 border-4 border-red-400'
              }`}
            >
              {animationType === 'sold' ? 'SOLD!' : 'UNSOLD!'}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AuctionRoom