'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react'
import type { Section } from '@/types'

interface Props {
  sections: Section[]
  projectId: string
}

export default function ApprovalPanel({ sections: initial, projectId }: Props) {
  const [sections, setSections] = useState<Section[]>(initial)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const supabase = createClient()

  async function handleDecision(sectionId: string, decision: 'approved' | 'rejected') {
    setLoading(l => ({ ...l, [sectionId]: true }))

    const { error } = await supabase
      .from('sections')
      .update({
        status: decision,
        client_notes: notes[sectionId] ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', sectionId)

    if (!error) {
      setSections(prev => prev.map(s =>
        s.id === sectionId
          ? { ...s, status: decision, client_notes: notes[sectionId] ?? undefined }
          : s
      ))

      await fetch('/api/invoices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
    }

    setLoading(l => ({ ...l, [sectionId]: false }))
  }

  return (
    <div className="space-y-4">
      {sections.map(section => (
        <SectionCard
          key={section.id}
          section={section}
          note={notes[section.id] ?? ''}
          onNoteChange={text => setNotes(n => ({ ...n, [section.id]: text }))}
          onDecision={decision => handleDecision(section.id, decision)}
          loading={loading[section.id] ?? false}
        />
      ))}
    </div>
  )
}

interface CardProps {
  section: Section
  note: string
  onNoteChange: (text: string) => void
  onDecision: (d: 'approved' | 'rejected') => void
  loading: boolean
}

function SectionCard({ section, note, onNoteChange, onDecision, loading }: CardProps) {
  const [showNotes, setShowNotes] = useState(section.status === 'rejected')
  const isDone = section.status === 'approved' || section.status === 'rejected'

  const borderOverride = section.status === 'approved'
    ? 'rgba(45,212,191,0.3)'
    : section.status === 'rejected'
    ? 'rgba(248,113,113,0.3)'
    : 'var(--border)'

  return (
    <div
      className="card transition-all"
      style={{ borderColor: borderOverride }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {section.status === 'approved' && <CheckCircle size={16} style={{ color: 'var(--success)' }} />}
            {section.status === 'rejected' && <XCircle size={16} style={{ color: 'var(--danger)' }} />}
            <h3 className="font-semibold" style={{ color: 'var(--accent)' }}>{section.name}</h3>
          </div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Pages {section.page_start}–{section.page_end}
          </p>

          {section.status !== 'pending' && section.client_notes && (
            <p className="text-sm mt-2" style={{ color: 'var(--warning)' }}>
              Your note: &ldquo;{section.client_notes}&rdquo;
            </p>
          )}
        </div>

        {!isDone && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowNotes(v => !v)}
              className="p-2 rounded-lg border transition-colors"
              style={showNotes
                ? { borderColor: 'rgba(212,175,55,0.5)', color: 'var(--accent)' }
                : { borderColor: 'var(--border)', color: 'var(--text-muted)' }
              }
              title="Add note"
            >
              <MessageSquare size={15} />
            </button>
            <button
              onClick={() => onDecision('rejected')}
              disabled={loading}
              className="btn-danger flex items-center gap-1.5 text-sm py-2"
            >
              <XCircle size={15} />
              Request Changes
            </button>
            <button
              onClick={() => onDecision('approved')}
              disabled={loading}
              className="btn-success flex items-center gap-1.5 text-sm py-2 px-4"
            >
              <CheckCircle size={15} />
              Approve
            </button>
          </div>
        )}

        {isDone && (
          <span
            className="text-sm font-medium px-3 py-1 rounded-full"
            style={section.status === 'approved'
              ? { color: 'var(--success)', background: 'rgba(45,212,191,0.1)' }
              : { color: 'var(--danger)', background: 'rgba(248,113,113,0.1)' }
            }
          >
            {section.status === 'approved' ? 'Approved ✓' : 'Changes Requested'}
          </span>
        )}
      </div>

      {showNotes && !isDone && (
        <div className="mt-4">
          <label className="label">Note for designer (optional)</label>
          <textarea
            className="input min-h-[80px] resize-none"
            placeholder="Describe what you'd like changed..."
            value={note}
            onChange={e => onNoteChange(e.target.value)}
          />
        </div>
      )}

      {loading && (
        <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <div
            className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
          Saving…
        </div>
      )}
    </div>
  )
}
