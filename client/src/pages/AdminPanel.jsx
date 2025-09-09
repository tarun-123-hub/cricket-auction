import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { startAuction, createEvent } from '../store/slices/auctionSlice'
import { useNavigate } from 'react-router-dom'

const AdminPanel = () => {
  const { players } = useSelector((s) => s.players)
  const auction = useSelector((s)=> s.auction)
  const socket = useSelector((s)=> s.socket.socket)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [eventName, setEventName] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('')
  const [isEventLive, setIsEventLive] = useState(false)
  const [searchAvail, setSearchAvail] = useState('')
  const [searchSel, setSearchSel] = useState('')
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const onCreate = (e) => {
    e.preventDefault()
    const selected = players.filter(p => selectedIds.includes(p._id))
    dispatch(createEvent({
      eventName: eventName || 'Auction Event',
      eventDescription,
      maxPlayers: maxPlayers || 0,
      eventPlayers: selected
    }))
    setShowCreate(false)
  }

  const canStart = useMemo(()=> auction.eventPlayers?.length > 0, [auction.eventPlayers])

  const activateEvent = () => {
    setIsEventLive(true)
    if (socket && socket.connected) {
      const selected = players.filter(p => selectedIds.includes(p._id))
      socket.emit('activate-event', {
        eventName: eventName || auction.eventName,
        eventDescription,
        maxPlayers: maxPlayers || auction.maxPlayers,
        eventPlayers: selected,
      })
    }
  }

  const startLiveAuctionWithFirst = () => {
    const list = auction.eventPlayers && auction.eventPlayers.length > 0 ? auction.eventPlayers : players.filter(p => selectedIds.includes(p._id))
    if (!list || list.length === 0) return
    const rnd = Math.floor(Math.random() * list.length)
    const first = list[rnd]
    if (!first) return
    dispatch(startAuction({
      currentPlayer: first,
      baseBid: first.basePrice,
      eventName: auction.eventName,
      maxPlayers: auction.maxPlayers
    }))
    navigate('/auction')
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white">Admin Panel</h1>

        {/* Event Builder */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-2">
            <h2 className="text-white font-semibold mb-3">Create Auction Event</h2>
            <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-300 mb-1">Event Name</label>
                <input className="input-field" placeholder="e.g., Namma Premier Auction 2025" value={eventName} onChange={(e)=>setEventName(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <textarea className="input-field h-24" placeholder="Short description" value={eventDescription} onChange={(e)=>setEventDescription(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Max Players</label>
                <input className="input-field" type="number" min="1" placeholder="150" value={maxPlayers} onChange={(e)=>setMaxPlayers(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-300 mb-2">Add Players to Event</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-800 rounded p-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Available</span>
                      <input className="input-field h-8 w-40" placeholder="Search" value={searchAvail} onChange={(e)=>setSearchAvail(e.target.value)} />
                    </div>
                    <div className="h-44 overflow-auto space-y-1">
                      {players
                        .filter(p => !selectedIds.includes(p._id))
                        .filter(p => p.name.toLowerCase().includes(searchAvail.toLowerCase()))
                        .map(p => (
                          <div key={p._id} className="flex items-center justify-between bg-gray-700 rounded px-2 py-1 text-sm text-gray-200">
                            <span className="truncate">{p.name}</span>
                            <button type="button" className="text-xs bg-blue-600 px-2 py-0.5 rounded" onClick={()=>setSelectedIds(prev=>[...prev,p._id])}>Add</button>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded p-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Selected</span>
                      <input className="input-field h-8 w-40" placeholder="Search" value={searchSel} onChange={(e)=>setSearchSel(e.target.value)} />
                    </div>
                    <div className="h-44 overflow-auto space-y-1">
                      {players
                        .filter(p => selectedIds.includes(p._id))
                        .filter(p => p.name.toLowerCase().includes(searchSel.toLowerCase()))
                        .map(p => (
                          <div key={p._id} className="flex items-center justify-between bg-gray-700 rounded px-2 py-1 text-sm text-gray-200">
                            <span className="truncate">{p.name}</span>
                            <button type="button" className="text-xs bg-red-600 px-2 py-0.5 rounded" onClick={()=>setSelectedIds(prev=>prev.filter(id=>id!==p._id))}>Remove</button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={()=>{setSelectedIds([]);setEventName('');setEventDescription('');setMaxPlayers('')}}>Reset</button>
                <button type="submit" className="btn-primary">Save Event</button>
              </div>
            </form>
          </div>
          <div className="space-y-4">
            <div className="card">
              <p className="text-gray-400 text-sm">Event Status</p>
              <p className="text-white text-xl font-semibold">{auction?.isEventLive ? 'Live' : 'Not Live'}</p>
              <div className="mt-3 flex gap-2">
                <button className="btn-secondary" onClick={() => navigate('/admin/players')}>Manage Players</button>
                <button className={`btn-primary ${auction?.isEventLive ? 'opacity-70 cursor-default' : ''}`} onClick={activateEvent} disabled={auction?.isEventLive}>
                  {auction?.isEventLive ? 'Activated' : 'Activate'}
                </button>
              </div>
            </div>
            <div className="card">
              <p className="text-gray-400 text-sm">Start Auction</p>
              <p className="text-gray-300 text-sm mb-2">Use event players list to start</p>
              <button disabled={!canStart} className={`btn-primary ${!canStart ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={startLiveAuctionWithFirst}>Start With First Player</button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-gray-400 text-sm">Event</p>
            <p className="text-white text-xl font-semibold">{auction?.eventName || '—'}</p>
          </div>
          <div className="card">
            <p className="text-gray-400 text-sm">Players</p>
            <p className="text-white text-xl font-semibold">{auction?.eventPlayers?.length || 0}</p>
          </div>
          <div className="card">
            <p className="text-gray-400 text-sm">Sold</p>
            <p className="text-white text-xl font-semibold">—</p>
          </div>
          <div className="card">
            <p className="text-gray-400 text-sm">Unsold</p>
            <p className="text-white text-xl font-semibold">—</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminPanel;