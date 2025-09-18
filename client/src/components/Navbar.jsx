import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logoutUser, localLogout } from '../store/slices/authSlice'
import { disconnect } from '../store/slices/socketSlice'
import { 
  Home, 
  Gavel, 
  BarChart3, 
  Settings, 
  Users, 
  LogOut, 
  Menu, 
  X,
  Trophy,
  User
} from 'lucide-react'

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  const { isConnected } = useSelector((state) => state.socket)
  const { isEventLive, eventName } = useSelector((state) => state.auction)

  const handleLogout = () => {
    dispatch(disconnect())
    // Use local logout for demo; if server session exists, also call logoutUser safely
    dispatch(localLogout())
    navigate('/login')
    try { dispatch(logoutUser()) } catch (_) {}
  }

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/auction', icon: Gavel, label: 'Auction Room' },
    { path: '/stats', icon: BarChart3, label: 'Statistics' },
  ]

  const adminItems = [
    { path: '/admin', icon: Settings, label: 'Admin Panel' },
    { path: '/players', icon: Users, label: 'Players' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-gray-800 border-b border-gray-700 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16"> {/* Reduced back to normal height */}
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2"> {/* Reduced spacing */}
              <Trophy className="h-8 w-8 text-yellow-500" /> {/* Reduced icon size */}
              <span className="font-cricket text-xl font-bold text-white"> {/* Reduced font size */}
                Namma Cricket
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors duration-200 ${ /* Reduced padding, font size and spacing */
                      isActive(item.path)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {/* Reduced icon size */}
                    <span>{item.label}</span>
                  </Link>
                )
              })}

              {isEventLive && (
                <div className="px-3 py-2 rounded-md text-sm font-semibold bg-green-600 text-white"> {/* Reduced padding and font size */}
                  Live: {eventName || 'Auction Event'}
                </div>
              )}

              {user?.role === 'admin' && (
                <>
                  <div className="h-6 w-px bg-gray-600 mx-2" />
                  {adminItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors duration-200 ${
                          isActive(item.path)
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </>
              )}
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-xs text-gray-400">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <User className="h-4 w-4" />
                <span>{user?.username}</span>
                {user?.team && (
                  <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                    {user.team}
                  </span>
                )}
                <span className="text-xs bg-gray-600 px-2 py-1 rounded capitalize">
                  {user?.role}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800 border-t border-gray-700">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}

            {user?.role === 'admin' && (
              <>
                <div className="border-t border-gray-600 my-2" />
                {adminItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 ${
                        isActive(item.path)
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </>
            )}

            <div className="border-t border-gray-600 my-2" />
            
            {/* User Info Mobile */}
            <div className="px-3 py-2">
              <div className="flex items-center space-x-2 text-sm text-gray-300 mb-2">
                <User className="h-4 w-4" />
                <span>{user?.username}</span>
              </div>
              {user?.team && (
                <div className="text-xs bg-blue-600 px-2 py-1 rounded inline-block mb-2">
                  {user.team}
                </div>
              )}
              <div className="text-xs bg-gray-600 px-2 py-1 rounded inline-block capitalize">
                {user?.role}
              </div>
            </div>

            {/* Connection Status Mobile */}
            <div className="px-3 py-2 flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-xs text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Logout Mobile */}
            <button
              onClick={handleLogout}
              className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white flex items-center space-x-2"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar