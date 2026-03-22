'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, UserPlus, ChevronDown } from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string
}

export default function CreateProjectModal({ clients: initialClients }: { clients: Client[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<Client[]>(initialClients)

  // New client inline form
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', email: '' })
  const [creatingClient, setCreatingClient] = useState(false)
  const [clientError, setClientError] = useState('')

  const [form, setForm] = useState({ title: '', client_id: '', total_price: '' })

  async function handleCreateClient() {
    if (!newClient.name || !newClient.email) {
      setClientError('Name and email required')
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

    if (!res.ok) {
      setClientError(data.error ?? 'Failed to create client')
      setCreatingClient(false)
      return
    }

    // Add to local list and auto-select
    const created: Client = { id: data.id, name: data.name, email: data.email }
    setClients(prev => [...prev, created])
    setForm(f => ({ ...f, client_id: created.id }))
    setNewClient({ name: '', email: '' })
    setShowNewClient(false)
    setCreatingClient(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: err } = await supabase
      .from('projects')
      .insert({
        title: form.title,
        client_id: form.client_id || null,
        total_price: parseFloat(form.total_price) || 0,
        status: 'draft',
      })
      .select('id')
      .single()

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setOpen(false)
    router.refresh()
    router.push(`/admin/projects/${data.id}`)
  }

  function handleClose() {
    setOpen(false)
    setError('')
    setClientError('')
    setShowNewClient(false)
    setForm({ title: '', client_id: '', total_price: '' })
    setNewClient({ name: '', email: '' })
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
        <Plus size={16} />
        New Project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg card overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold gold-text">New Journal Project</h2>
              <button onClick={handleClose} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="label">Journal Title</label>
                <input
                  className="input"
                  placeholder="e.g. Sarah's Gratitude Journal"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>

              {/* Client picker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Client</label>
                  <button
                    type="button"
                    onClick={() => setShowNewClient(v => !v)}
                    className="flex items-center gap-1 text-xs font-semibold transition-colors"
                    style={{ color: 'var(--accent)' }}
                  >
                    <UserPlus size={13} />
                    {showNewClient ? 'Cancel' : 'Create New Client'}
                  </button>
                </div>

                {!showNewClient ? (
                  <select
                    className="input"
                    value={form.client_id}
                    onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                  >
                    <option value="">— Assign later —</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                    ))}
                  </select>
                ) : (
                  <div
                    className="rounded-xl p-4 space-y-3"
                    style={{ background: 'var(--accent-dim)', border: '1.5px solid rgba(184,131,42,0.2)' }}
                  >
                    <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Invite Client</p>
                    <input
                      className="input"
                      placeholder="Full name"
                      value={newClient.name}
                      onChange={e => setNewClient(n => ({ ...n, name: e.target.value }))}
                    />
                    <input
                      className="input"
                      type="email"
                      placeholder="Email address"
                      value={newClient.email}
                      onChange={e => setNewClient(n => ({ ...n, email: e.target.value }))}
                    />
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      ✉️ An invite email will be sent so they can set their own password.
                    </p>
                    {clientError && (
                      <p className="text-xs" style={{ color: 'var(--danger)' }}>{clientError}</p>
                    )}
                    <button
                      type="button"
                      onClick={handleCreateClient}
                      disabled={creatingClient}
                      className="btn-primary w-full text-sm py-2"
                    >
                      {creatingClient ? 'Sending invite…' : 'Send Invite & Select Client'}
                    </button>
                  </div>
                )}

                {form.client_id && (
                  <p className="text-xs mt-1.5" style={{ color: 'var(--success)' }}>
                    ✓ {clients.find(c => c.id === form.client_id)?.name} selected
                  </p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="label">Total Project Price ($)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="500.00"
                  min="0"
                  step="0.01"
                  value={form.total_price}
                  onChange={e => setForm(f => ({ ...f, total_price: e.target.value }))}
                  required
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Client invoiced 25% (${form.total_price ? (parseFloat(form.total_price) * 0.25).toFixed(2) : '0.00'}) at each milestone.
                </p>
              </div>

              {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleClose} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={loading}>
                  {loading ? 'Creating…' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
