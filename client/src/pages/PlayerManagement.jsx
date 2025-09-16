import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { addPlayerLocal, deletePlayerLocal } from '../store/slices/playersSlice'

const PlayerManagement = () => {
  const dispatch = useDispatch()
  const { players } = useSelector((s) => s.players)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', role: 'Batsman', basePrice: 0, country: 'India', stats: '', image: null })
  const [imagePreview, setImagePreview] = useState(null)
  const [search, setSearch] = useState('')
  const importInputRef = useRef(null)

  const onAdd = (e) => {
    e.preventDefault()
    if (!form.name) return
    dispatch(addPlayerLocal(form))
    setShowAdd(false)
    setForm({ name: '', role: 'Batsman', basePrice: 0, country: 'India', stats: '', image: null })
    setImagePreview(null)
  }

  const onFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result
      setForm({ ...form, image: dataUrl })
      setImagePreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.country.toLowerCase().includes(search.toLowerCase()) ||
    p.role.toLowerCase().includes(search.toLowerCase())
  )

  const triggerImport = () => {
    importInputRef.current?.click()
  }

  const parseCsv = (text) => {
    const lines = text.replace(/\r/g, '').split('\n').filter(Boolean)
    if (lines.length === 0) return []
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const raw = lines[i]
      if (!raw.trim()) continue
      // Basic CSV parse supporting quoted commas
      const cols = []
      let current = ''
      let inQuotes = false
      for (let c = 0; c < raw.length; c++) {
        const ch = raw[c]
        if (ch === '"') {
          if (inQuotes && raw[c + 1] === '"') {
            current += '"'
            c++
          } else {
            inQuotes = !inQuotes
          }
        } else if (ch === ',' && !inQuotes) {
          cols.push(current)
          current = ''
        } else {
          current += ch
        }
      }
      cols.push(current)

      const entry = {}
      headers.forEach((h, idx) => {
        entry[h] = (cols[idx] ?? '').trim()
      })
      rows.push(entry)
    }
    return rows
  }

  const handleImportCsv = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const rows = parseCsv(text)
    const mapped = rows.map((r) => ({
      name: r.name || r.player || '',
      role: (r.type || r.role || 'Batsman').replace(/all\s*rounder/i, 'All Rounder'),
      basePrice: Number(r.baseprice || r.base_price || r.price || 0) || 0,
      country: r.country || 'India',
      stats: r.stats || r.statistics || '',
      image: null,
    })).filter(p => p.name)
    mapped.forEach((p) => dispatch(addPlayerLocal(p)))
    // reset input so same file can be re-imported if needed
    if (importInputRef.current) importInputRef.current.value = ''
  }

  const handleExportCsv = () => {
    const headers = ['Name','Type','BasePrice','Country','Stats']
    const rows = players.map(p => [
      p.name,
      p.role,
      p.basePrice,
      p.country,
      (p.stats ?? '').toString().replace(/\n/g, ' ')
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map((v) => {
      const s = String(v ?? '')
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'players.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white">Player Management</h1>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary" onClick={() => setShowAdd(true)}>Add Player</button>
          <input ref={importInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImportCsv} />
          <button className="btn-secondary" onClick={triggerImport}>Import CSV</button>
          <button className="btn-secondary" onClick={handleExportCsv}>Export CSV</button>
        </div>

        {/* Table / Empty State */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-semibold">Players</p>
            <input className="input-field w-64" placeholder="Search players" value={search} onChange={(e)=>setSearch(e.target.value)} />
          </div>
          {filteredPlayers.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-center">
              <div>
                <p className="text-lg text-gray-300 mb-1">No players yet</p>
                <p className="text-gray-500">Add players or import from a CSV file.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-gray-300">
                  <tr>
                    <th className="py-2">Player</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Base Price</th>
                    <th className="py-2">Country</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map(p => (
                    <tr key={p._id} className="border-t border-gray-700">
                      <td className="py-2 text-white">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-700" />
                          )}
                          <div>
                            <div>{p.name}</div>
                            {p.stats && <div className="text-xs text-gray-400">{p.stats}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 text-gray-300">{p.role}</td>
                      <td className="py-2 text-gray-300">₹{p.basePrice}</td>
                      <td className="py-2 text-gray-300">{p.country}</td>
                      <td className="py-2 text-right">
                        <button className="btn-danger" onClick={() => dispatch(deletePlayerLocal(p._id))}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <form onSubmit={onAdd} className="card w-full max-w-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Add Player</h2>
              <div className="space-y-3">
                <label className="block text-sm text-gray-300">Name</label>
                <input className="input-field" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} />

                <label className="block text-sm text-gray-300">Type</label>
                <select className="input-field" value={form.role} onChange={(e)=>setForm({...form, role:e.target.value})}>
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All Rounder">All Rounder</option>
                  <option value="Wicketkeeper">Wicketkeeper</option>
                </select>

                <label className="block text-sm text-gray-300">Base Price</label>
                <input className="input-field" type="number" value={form.basePrice} onChange={(e)=>setForm({...form, basePrice:e.target.value})} />

                <label className="block text-sm text-gray-300">Key Statistics</label>
                <input className="input-field" value={form.stats} onChange={(e)=>setForm({...form, stats:e.target.value})} />

                <label className="block text-sm text-gray-300">Country</label>
                <input className="input-field" value={form.country} onChange={(e)=>setForm({...form, country:e.target.value})} />

                <label className="block text-sm text-gray-300">Image</label>
                <input type="file" accept="image/*" className="input-field" onChange={onFile} />
                {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded" />}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={()=>setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerManagement;