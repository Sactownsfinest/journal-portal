'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X } from 'lucide-react'

interface Props {
  projectId: string
  totalSections: number | null
  createdSections: number
}

export default function TotalSectionsEditor({ projectId, totalSections, createdSections }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(totalSections ?? ''))
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function save() {
    const num = parseInt(value)
    if (isNaN(num) || num < 1) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('projects').update({ total_sections: num }).eq('id', projectId)
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  function cancel() {
    setValue(String(totalSections ?? ''))
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Total sections:</span>
        <input
          type="number"
          min={1}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
          autoFocus
          className="w-16 text-center text-sm font-bold rounded-lg px-2 py-1"
          style={{ border: '1.5px solid var(--accent)', background: 'var(--surface)', color: 'var(--text)' }}
        />
        <button
          onClick={save}
          disabled={saving}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: 'rgba(74,158,127,0.12)', color: 'var(--success)', border: '1px solid rgba(74,158,127,0.3)' }}
        >
          <Check size={13} />
        </button>
        <button
          onClick={cancel}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: 'rgba(44,36,22,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          <X size={13} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {createdSections} of{' '}
        <span className="font-bold" style={{ color: 'var(--text)' }}>
          {totalSections ?? '?'}
        </span>
        {' '}sections created
      </span>
      <button
        onClick={() => setEditing(true)}
        className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        title="Set expected total sections"
      >
        <Pencil size={11} />
      </button>
    </div>
  )
}
