'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, X } from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string
}

export default function CreateProjectModal({ clients }: { clients: Client[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    client_id: '',
    total_price: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
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

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
        <Plus size={16} />
        New Project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">New Journal Project</h2>
              <button onClick={() => setOpen(false)} className="text-[#888] hover:text-[#f5f0e8]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div>
                <label className="label">Client</label>
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
              </div>

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
                <p className="text-xs text-[#888] mt-1">
                  Client will be invoiced 25% (${ form.total_price ? (parseFloat(form.total_price) * 0.25).toFixed(2) : '0.00' }) at each approval milestone.
                </p>
              </div>

              {error && (
                <p className="text-sm text-[#e05252]">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
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
