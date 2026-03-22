'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, Check, X } from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string
}

interface Props {
  projectId: string
  currentClientId: string | null
  currentClientName: string | null
  clients: Client[]
}

export default function AssignClientPanel({ projectId, currentClientId, currentClientName, clients }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [selectedId, setSelectedId] = useState(currentClientId ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // New client inline
  const [showNew, setShowNew] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', email: '' })
  const [creatingClient, setCreatingClient] = useState(false)
  const [clientError, setClientError] = useState('')
  const [inviteSent, setInviteSent] = useState(false)
  const [allClients, setAllClients] = useState<Client[]>(clients)

  async function handleCreateClient() {
    if (!newClient.name || !newClient.email) {
      setClientError('Name and email are required')
      return
    }
    setCreatingClient(true)
    setClientError('')
    const res = await fetch('/api/admin/create-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClient),
    })
    const data = await res.json()
    if (!res.ok) { setClientError(data.error ?? 'Failed'); setCreatingClient(false); return }
    const created: Client = { id: data.id, name: data.name, email: data.email }
    setAllClients(prev => [...prev, created])
    setSelectedId(created.id)
    setNewClient({ name: '', email: '' })
    setInviteSent(true)
    setShowNew(false)
    setCreatingClient(false)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('projects')
      .update({ client_id: selectedId || null })
      .eq('id', projectId)
    if (err) { setError(err.message); setSaving(false); return }
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-3">
        <div>
          {currentClientName ? (
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{currentClientName}</span>
          ) : (
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>No client assigned</span>
          )}
        </div>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
          style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(184,131,42,0.25)' }}
        >
          <UserPlus size={13} />
          {currentClientName ? 'Reassign' : 'Assign Client'}
        </button>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ background: 'var(--card)', border: '1.5px solid rgba(184,131,42,0.2)' }}
    >
      <div className="flex items-center justify-between">
        <p className="font-bold" style={{ color: 'var(--accent)' }}>Assign Client</p>
        <button onClick={() => { setEditing(false); setShowNew(false) }} style={{ color: 'var(--text-muted)' }}>
          <X size={16} />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="label mb-0">Select existing client</label>
        <button
          type="button"
          onClick={() => setShowNew(v => !v)}
          className="flex items-center gap-1 text-xs font-semibold"
          style={{ color: 'var(--accent)' }}
        >
          <UserPlus size={13} />
          {showNew ? 'Cancel' : 'Create New'}
        </button>
      </div>

      {!showNew ? (
        <select
          className="input"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          <option value="">— No client —</option>
          {allClients.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
          ))}
        </select>
      ) : (
        <div className="space-y-2 p-3 rounded-xl" style={{ background: 'var(--accent-dim)', border: '1px solid rgba(184,131,42,0.2)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>New Client Account</p>
          <input className="input" placeholder="Full name" value={newClient.name} onChange={e => setNewClient(n => ({ ...n, name: e.target.value }))} />
          <input className="input" type="email" placeholder="Email" value={newClient.email} onChange={e => setNewClient(n => ({ ...n, email: e.target.value }))} />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>✉️ An invite email will be sent so they can set their own password.</p>
          {clientError && <p className="text-xs" style={{ color: 'var(--danger)' }}>{clientError}</p>}
          <button type="button" onClick={handleCreateClient} disabled={creatingClient} className="btn-primary w-full text-sm py-2">
            {creatingClient ? 'Sending Invite…' : 'Send Invite & Select'}
          </button>
        </div>
      )}

      {selectedId && !showNew && (
        <p className="text-xs" style={{ color: 'var(--success)' }}>
          ✓ {allClients.find(c => c.id === selectedId)?.name} will be assigned
          {inviteSent && ' — invite email sent'}
        </p>
      )}

      {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}

      <div className="flex gap-2">
        <button onClick={() => { setEditing(false); setShowNew(false) }} className="btn-secondary flex-1 text-sm">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-1.5">
          <Check size={14} />
          {saving ? 'Saving…' : 'Save Assignment'}
        </button>
      </div>
    </div>
  )
}
