import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { checkAuth } from './store/slices/authSlice'
import { initializeSocket } from './store/slices/socketSlice'

// Components
import Navbar from './components/Navbar'
import LoadingSpinner from './components/LoadingSpinner'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AuctionRoom from './pages/AuctionRoom'
import AdminPanel from './pages/AdminPanel'
import PlayerManagement from './pages/PlayerManagement'
import AuctionStats from './pages/AuctionStats'
import AuctionSummary from './pages/AuctionSummary'
import BidderThankYou from './pages/BidderThankYou'

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function App() {
  const dispatch = useDispatch()
  const { isLoading, isAuthenticated, user, token } = useSelector((state) => state.auth)

  useEffect(() => {
    const isDemo = typeof token === 'string' && token.startsWith('local_dev_token')
    if (!isDemo) {
      dispatch(checkAuth())
    }
    // In demo mode, skip server check; nothing to do
  }, [dispatch, token])

  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(initializeSocket())
    }
  }, [dispatch, isAuthenticated, user])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {isAuthenticated && <Navbar />}
      
      <main className={isAuthenticated ? 'pt-16' : ''}>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} 
          />
          <Route 
            path="/register" 
            element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />} 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/auction" 
            element={
              <ProtectedRoute>
                <AuctionRoom />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/stats" 
            element={
              <ProtectedRoute>
                <AuctionStats />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Only Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/players" 
            element={
              <ProtectedRoute requiredRole="admin">
                <PlayerManagement />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/auction-summary" 
            element={
              <ProtectedRoute>
                <AuctionSummary />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/bidder-thank-you" 
            element={
              <ProtectedRoute requiredRole="bidder">
                <BidderThankYou />
              </ProtectedRoute>
            } 
          />
          
          {/* Default Route */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <Navigate to="/login" replace />
            } 
          />
          
          {/* 404 Route */}
          <Route 
            path="*" 
            element={
              <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
                  <p className="text-xl text-gray-500 mb-8">Page not found</p>
                  <button 
                    onClick={() => window.history.back()}
                    className="btn-primary"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            } 
          />
        </Routes>
      </main>
    </div>
  )
}

export default App