import React, { useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Trophy, 
  Download, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Star,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Calendar,
  Award
} from 'lucide-react'
import { resetAuction } from '../store/slices/auctionSlice'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const AuctionSummary = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const summaryRef = useRef()
  
  const { auctionSummary, soldPlayers, unsoldPlayers, teams } = useSelector((state) => state.auction)
  const { user } = useSelector((state) => state.auth)

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  const totalValue = soldPlayers.reduce((sum, player) => sum + (player.finalPrice || 0), 0)
  const teamArray = Object.values(teams || {})

  const generatePDF = async () => {
    if (!summaryRef.current) return

    try {
      const canvas = await html2canvas(summaryRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#111827'
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`${auctionSummary?.eventName || 'Auction'}_Summary.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  const handleBackToDashboard = () => {
    if (user?.role === 'admin') {
      dispatch(resetAuction())
    }
    navigate('/dashboard')
  }

  if (!auctionSummary) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">No auction summary available</h1>
          <button onClick={handleBackToDashboard} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <button
            onClick={generatePDF}
            className="btn-primary flex items-center space-x-2"
          >
            <Download className="h-5 w-5" />
            <span>Download PDF</span>
          </button>
        </div>

        {/* Summary Content */}
        <div ref={summaryRef} className="space-y-8">
          {/* Title Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-2xl p-8 border border-blue-500/30"
          >
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-5xl font-cricket font-bold text-white mb-4">
              {auctionSummary.eventName}
            </h1>
            <p className="text-xl text-gray-300 mb-4">Auction Summary Report</p>
            <div className="flex items-center justify-center space-x-2 text-gray-400">
              <Calendar className="h-5 w-5" />
              <span>Completed on {new Date(auctionSummary.completedAt).toLocaleDateString()}</span>
            </div>
          </motion.div>

          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Players</p>
                  <p className="text-3xl font-bold text-white">{auctionSummary.totalPlayers}</p>
                </div>
                <Users className="h-12 w-12 text-blue-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Players Sold</p>
                  <p className="text-3xl font-bold text-green-400">{soldPlayers.length}</p>
                </div>
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Players Unsold</p>
                  <p className="text-3xl font-bold text-red-400">{unsoldPlayers.length}</p>
                </div>
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Value</p>
                  <p className="text-2xl font-bold text-yellow-400">{formatCurrency(totalValue)}</p>
                </div>
                <DollarSign className="h-12 w-12 text-yellow-500" />
              </div>
            </motion.div>
          </div>

          {/* Team Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Award className="h-6 w-6 mr-3 text-purple-500" />
              Team Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teamArray.map((team, index) => {
                const teamSpent = team.players.reduce((sum, player) => sum + (player.finalPrice || 0), 0)
                return (
                  <motion.div
                    key={team.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-500/20"
                  >
                    <h3 className="text-xl font-bold text-white mb-4">{team.name}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Players Bought:</span>
                        <span className="font-semibold text-white">{team.players.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Total Spent:</span>
                        <span className="font-semibold text-green-400">{formatCurrency(teamSpent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Remaining:</span>
                        <span className="font-semibold text-blue-400">{formatCurrency(team.purse)}</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Sold Players */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <CheckCircle className="h-6 w-6 mr-3 text-green-500" />
              Sold Players ({soldPlayers.length})
            </h2>
            {soldPlayers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {soldPlayers.map((player, index) => (
                  <motion.div
                    key={player._id || index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.05 }}
                    className="bg-green-900/20 border border-green-500/30 rounded-lg p-4"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      {player.image ? (
                        <img
                          src={player.image}
                          alt={player.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                          <Star className="h-6 w-6 text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-white">{player.name}</h3>
                        <p className="text-sm text-gray-400">{player.role}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Sold to:</span>
                        <span className="text-blue-400 font-semibold">{player.soldTo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Price:</span>
                        <span className="text-green-400 font-bold">{formatCurrency(player.finalPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Base:</span>
                        <span className="text-gray-300">{formatCurrency(player.basePrice)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No players were sold</p>
            )}
          </motion.div>

          {/* Unsold Players */}
          {unsoldPlayers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50"
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <XCircle className="h-6 w-6 mr-3 text-red-500" />
                Unsold Players ({unsoldPlayers.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unsoldPlayers.map((player, index) => (
                  <motion.div
                    key={player._id || index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.0 + index * 0.05 }}
                    className="bg-red-900/20 border border-red-500/30 rounded-lg p-4"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      {player.image ? (
                        <img
                          src={player.image}
                          alt={player.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                          <Star className="h-6 w-6 text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-white">{player.name}</h3>
                        <p className="text-sm text-gray-400">{player.role}</p>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Base Price:</span>
                      <span className="text-gray-300">{formatCurrency(player.basePrice)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuctionSummary