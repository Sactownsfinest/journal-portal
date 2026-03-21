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

      // Trigger milestone check
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

  return (
    <div className={`card transition-colors ${
      section.status === 'approved' ? 'border-[#4caf84]/30' :
      section.status === 'rejected' ? 'border-[#e05252]/30' : ''
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {section.status === 'approved' && <CheckCircle size={16} className="text-[#4caf84]" />}
            {section.status === 'rejected' && <XCircle size={16} className="text-[#e05252]" />}
            <h3 className="font-semibold">{section.name}</h3>
          </div>
          <p className="text-sm text-[#888] mt-0.5">Pages {section.page_start}–{section.page_end}</p>

          {section.status !== 'pending' && section.client_notes && (
            <p className="text-sm text-[#e8a030] mt-2">Your note: "{section.client_notes}"</p>
          )}
        </div>

        {!isDone && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowNotes(v => !v)}
              className={`p-2 rounded-lg border transition-colors ${showNotes ? 'border-[#c8a96e]/50 text-[#c8a96e]' : 'border-[#333] text-[#888] hover:text-[#f5f0e8]'}`}
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
              className="bg-[#4caf84] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#3d9e70] transition-colors disabled:opacity-50 flex items-center gap-1.5 text-sm"
            >
              <CheckCircle size={15} />
              Approve
            </button>
          </div>
        )}

        {isDone && (
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            section.status === 'approved' ? 'text-[#4caf84] bg-[#4caf84]/10' : 'text-[#e05252] bg-[#e05252]/10'
          }`}>
            {section.status === 'approved' ? 'Approved ✓' : 'Changes Requested'}
          </span>
        )}
      </div>

      {/* Notes textarea */}
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
        <div className="mt-3 flex items-center gap-2 text-sm text-[#888]">
          <div className="w-4 h-4 border-2 border-[#c8a96e] border-t-transparent rounded-full animate-spin" />
          Saving…
        </div>
      )}
    </div>
  )
}
