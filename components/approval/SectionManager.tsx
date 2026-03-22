'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import type { Section } from '@/types'

interface Props {
  projectId: string
  totalPages: number
  existingSections: Section[]
}

export default function SectionManager({ projectId, totalPages, existingSections }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [pageStart, setPageStart] = useState('')
  const [pageEnd, setPageEnd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const start = parseInt(pageStart)
    const end = parseInt(pageEnd)

    if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
      setError(`Page range must be between 1 and ${totalPages}`)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.from('sections').insert({
      project_id: projectId,
      name,
      page_start: start,
      page_end: end,
      status: 'pending',
    })

    if (err) {
      setError(err.message)
    } else {
      setOpen(false)
      setName('')
      setPageStart('')
      setPageEnd('')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary flex items-center gap-1.5 text-sm">
        <Plus size={14} />
        Add Section
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold" style={{ color: 'var(--accent)' }}>Add Section</h3>
              <button onClick={() => setOpen(false)} className="transition-colors hover:text-[#F8F4E3]" style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Section Name</label>
                <input
                  className="input"
                  placeholder="e.g. Introduction, Chapter 1..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Page</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={totalPages}
                    placeholder="1"
                    value={pageStart}
                    onChange={e => setPageStart(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">End Page</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={totalPages}
                    placeholder={String(totalPages)}
                    value={pageEnd}
                    onChange={e => setPageEnd(e.target.value)}
                    required
                  />
                </div>
              </div>
              {totalPages > 0 && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Project has {totalPages} pages.</p>
              )}
              {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={loading}>
                  {loading ? 'Adding…' : 'Add Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
