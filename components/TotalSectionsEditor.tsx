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
  // savedValue tracks what's actually in the DB so display updates immediately
  const [savedValue, setSavedValue] = useState<number | null>(totalSections)
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState(String(totalSections ?? ''))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function save() {
    const num = parseInt(inputValue)
    if (isNaN(num) || num < 1) {
      setError('Enter a number ≥ 1')
      return
    }
    setError('')
    setSaving(true)
    const supabase = createClient()
    const { error: dbErr } = await supabase
      .from('projects')
      .update({ total_sections: num })
      .eq('id', projectId)

    if (dbErr) {
      setError(dbErr.message)
      setSaving(false)
      return
    }

    setSavedValue(num)
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  function cancel() {
    setInputValue(String(savedValue ?? ''))
    setError('')
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Total sections in project:</span>
          <input
            type="number"
            min={1}
            value={inputValue}
            onChange={e => { setInputValue(e.target.value); setError('') }}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
            autoFocus
            className="w-16 text-center text-sm font-bold rounded-lg px-2 py-1"
            style={{ border: '1.5px solid var(--accent)', background: 'var(--surface)', color: 'var(--text)' }}
          />
          <button
            onClick={save}
            disabled={saving}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
            style={{ background: 'rgba(74,158,127,0.12)', color: 'var(--success)', border: '1px solid rgba(74,158,127,0.3)' }}
          >
            {saving
              ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              : <Check size={13} />
            }
          </button>
          <button
            onClick={cancel}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'rgba(44,36,22,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            <X size={13} />
          </button>
        </div>
        {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {createdSections} of{' '}
        <span className="font-bold" style={{ color: savedValue ? 'var(--text)' : 'var(--danger)' }}>
          {savedValue ?? '?'}
        </span>
        {' '}total sections
      </span>
      <button
        onClick={() => { setInputValue(String(savedValue ?? '')); setEditing(true) }}
        className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        title="Set total number of sections"
      >
        <Pencil size={11} />
      </button>
      {!savedValue && (
        <span className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>
          — set this to track progress correctly
        </span>
      )}
    </div>
  )
}
