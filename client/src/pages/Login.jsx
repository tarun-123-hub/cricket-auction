import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { clearError, localLogin } from '../store/slices/authSlice'
 

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  

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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h1 className="text-xl font-semibold text-white text-center mb-6">Sign In</h1>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button type="button" onClick={() => quickFill('admin')} className="btn-primary py-1 text-sm">Admin</button>
          <button type="button" onClick={() => quickFill('bidder')} className="btn-primary py-1 text-sm">Bidder</button>
          <button type="button" onClick={() => quickFill('spectator')} className="btn-primary py-1 text-sm">Spectator</button>
        </div>
        <div className="text-xs text-gray-400 mb-4 space-y-1">
          <p>Admin: admin / admin123</p>
          <p>Bidder: bidder / bidder123</p>
          <p>Spectator: spectator / spectator123</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm text-gray-300 mb-1">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={formData.username}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-gray-300 mb-1">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full btn-primary py-2 font-semibold"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login