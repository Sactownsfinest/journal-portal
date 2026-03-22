'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, MessageSquare, Eye, X, BookOpen } from 'lucide-react'
import type { Section, Page } from '@/types'

const FlipbookViewer = dynamic(() => import('@/components/flipbook/FlipbookViewer'), { ssr: false })

interface Props {
  sections: Section[]
  projectId: string
  pages?: Page[]
}

export default function ApprovalPanel({ sections: initial, projectId, pages = [] }: Props) {
  const [sections, setSections] = useState<Section[]>(initial)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [previewSection, setPreviewSection] = useState<Section | null>(null)
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

  // Filter pages that belong to a section by order_index (pages are 1-based in sections)
  function getSectionPages(section: Section): Page[] {
    if (!pages.length) return []
    return pages.filter(p =>
      (p.order_index + 1) >= section.page_start &&
      (p.order_index + 1) <= section.page_end
    )
  }

  return (
    <>
      <div className="space-y-4">
        {sections.map(section => (
          <SectionCard
            key={section.id}
            section={section}
            note={notes[section.id] ?? ''}
            onNoteChange={text => setNotes(n => ({ ...n, [section.id]: text }))}
            onDecision={decision => handleDecision(section.id, decision)}
            loading={loading[section.id] ?? false}
            hasPages={getSectionPages(section).length > 0}
            onPreview={() => setPreviewSection(section)}
          />
        ))}
      </div>

      {/* Section preview modal */}
      {previewSection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setPreviewSection(null)}
        >
          <div
            className="relative w-full max-w-3xl rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: 'var(--card)',
              border: '1.5px solid var(--border)',
              boxShadow: '0 24px 60px rgba(44,36,22,0.25)',
              maxHeight: '90vh',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{ borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, #FFFBF2, #FFF8ED)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--accent-dim)', border: '1px solid rgba(184,131,42,0.2)' }}>
                  <BookOpen size={16} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <h3 className="font-bold" style={{ color: 'var(--accent)' }}>{previewSection.name}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Pages {previewSection.page_start}–{previewSection.page_end}
                    {previewSection.status === 'approved' && (
                      <span className="ml-2 font-semibold" style={{ color: 'var(--success)' }}>✓ Approved</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewSection(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Flipbook */}
            <div className="flex-1 overflow-auto py-6 flex items-center justify-center"
              style={{ background: 'var(--bg)' }}>
              {getSectionPages(previewSection).length > 0 ? (
                <FlipbookViewer pages={getSectionPages(previewSection)} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Pages for this section haven't been built yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

interface CardProps {
  section: Section
  note: string
  onNoteChange: (text: string) => void
  onDecision: (d: 'approved' | 'rejected') => void
  loading: boolean
  hasPages: boolean
  onPreview: () => void
}

function SectionCard({ section, note, onNoteChange, onDecision, loading, hasPages, onPreview }: CardProps) {
  const [showNotes, setShowNotes] = useState(section.status === 'rejected')
  const isDone = section.status === 'approved' || section.status === 'rejected'

  const borderColor = section.status === 'approved'
    ? 'rgba(45,212,191,0.3)'
    : section.status === 'rejected'
    ? 'rgba(248,113,113,0.3)'
    : 'var(--border)'

  return (
    <div className="card transition-all" style={{ borderColor }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {section.status === 'approved' && <CheckCircle size={16} style={{ color: 'var(--success)' }} />}
            {section.status === 'rejected' && <XCircle size={16} style={{ color: 'var(--danger)' }} />}
            <h3 className="font-semibold" style={{ color: 'var(--accent)' }}>{section.name}</h3>
            {isDone && (
              <span
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={section.status === 'approved'
                  ? { color: 'var(--success)', background: 'rgba(45,212,191,0.1)' }
                  : { color: 'var(--danger)', background: 'rgba(248,113,113,0.1)' }
                }
              >
                {section.status === 'approved' ? 'Approved ✓' : 'Changes Requested'}
              </span>
            )}
          </div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Pages {section.page_start}–{section.page_end}
          </p>
          {section.client_notes && isDone && (
            <p className="text-sm mt-2" style={{ color: 'var(--warning)' }}>
              Your note: &ldquo;{section.client_notes}&rdquo;
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {/* Preview button — always available when pages exist */}
          {hasPages && (
            <button
              onClick={onPreview}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl transition-all"
              style={{
                color: 'var(--accent)',
                border: '1px solid rgba(184,131,42,0.3)',
                background: 'rgba(184,131,42,0.06)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(184,131,42,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(184,131,42,0.06)')}
            >
              <Eye size={14} />
              Preview
            </button>
          )}

          {/* Approve / reject — only when pending */}
          {!isDone && (
            <>
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
            </>
          )}
        </div>
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
          <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          Saving…
        </div>
      )}
    </div>
  )
}
