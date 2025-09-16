import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { clearError, localLogin } from '../store/slices/authSlice'
import { motion } from 'framer-motion'
import { Trophy, User, Lock, Eye, EyeOff, Zap } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading, error } = useSelector((state) => state.auth)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    
    // Clear error when user starts typing
    if (error) {
      dispatch(clearError())
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch(localLogin(formData))
    navigate('/dashboard', { replace: true })
  }

  const quickFill = (role) => {
    const creds = {
      admin: { username: 'admin', password: 'admin123' },
      bidder: { username: 'bidder', password: 'bidder123' },
      spectator: { username: 'spectator', password: 'spectator123' },
    }
    setFormData(creds[role])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <Trophy className="h-16 w-16 text-yellow-500" />
            </motion.div>
          </div>
          <h1 className="text-4xl font-cricket font-bold text-white mb-2">
            Namma Cricket
          </h1>
          <p className="text-xl text-blue-300 font-semibold">
            Auction Platform
          </p>
          <div className="flex items-center justify-center mt-4 space-x-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            <span className="text-gray-300">Live Auction Experience</span>
            <Zap className="h-5 w-5 text-yellow-400" />
          </div>
        </motion.div>

        {/* Login Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gray-800/80 backdrop-blur-xl p-8 rounded-2xl border border-gray-700/50 shadow-2xl"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-6">Welcome Back</h2>
          
          {/* Quick Fill Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button" 
              onClick={() => quickFill('admin')} 
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 text-sm"
            >
              Admin
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button" 
              onClick={() => quickFill('bidder')} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 text-sm"
            >
              Bidder
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button" 
              onClick={() => quickFill('spectator')} 
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 text-sm"
            >
              Spectator
            </motion.button>
          </div>
          
          {/* Demo Credentials */}
          <div className="bg-gray-900/50 rounded-lg p-4 mb-6 border border-gray-600/30">
            <p className="text-sm text-gray-300 font-semibold mb-2">Demo Credentials:</p>
            <div className="text-xs text-gray-400 space-y-1">
              <p><span className="text-purple-400">Admin:</span> admin / admin123</p>
              <p><span className="text-blue-400">Bidder:</span> bidder / bidder123</p>
              <p><span className="text-green-400">Spectator:</span> spectator / spectator123</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-base font-medium text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-base font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-4 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors duration-200" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors duration-200" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm backdrop-blur-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg shadow-lg"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="small" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Auction</span>
                  <Zap className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200"
              >
                Create one here
              </Link>
            </p>
          </div>
        </motion.div>
        
        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-8"
        >
          <p className="text-gray-400 text-sm">
            Experience the thrill of live cricket auctions
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default Login