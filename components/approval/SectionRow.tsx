'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { RotateCcw, CheckCircle } from 'lucide-react'
import type { Section } from '@/types'

const STATUS_CONFIG = {
  pending:  { color: 'var(--text-muted)', bg: 'rgba(42,74,107,0.4)',    label: 'Pending Review' },
  approved: { color: 'var(--success)',    bg: 'rgba(45,212,191,0.1)',   label: 'Approved' },
  rejected: { color: 'var(--danger)',     bg: 'rgba(248,113,113,0.1)', label: 'Rejected' },
}

export default function SectionRow({ section }: { section: Section }) {
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const s = STATUS_CONFIG[section.status]

  async function updateStatus(newStatus: 'pending' | 'approved') {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('sections')
      .update({ status: newStatus, reviewed_at: new Date().toISOString() })
      .eq('id', section.id)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium" style={{ color: 'var(--accent)' }}>{section.name}</h3>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ color: s.color, background: s.bg }}
            >
              {s.label}
            </span>
          </div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Pages {section.page_start}–{section.page_end}
          </p>
          {section.client_notes && (
            <p
              className="text-sm mt-2 rounded-lg px-3 py-2"
              style={{
                color: 'var(--warning)',
                background: 'rgba(251,191,36,0.08)',
                border: '1px solid rgba(251,191,36,0.2)',
              }}
            >
              Client note: &ldquo;{section.client_notes}&rdquo;
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {section.reviewed_at && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {new Date(section.reviewed_at).toLocaleDateString()}
            </p>
          )}

          {/* Admin override actions — shown on rejected or approved sections */}
          {section.status === 'rejected' && (
            <>
              <button
                onClick={() => updateStatus('pending')}
                disabled={saving}
                title="Reset to Pending (after making edits)"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'var(--surface)' }}
              >
                <RotateCcw size={11} />
                Reset to Pending
              </button>
              <button
                onClick={() => updateStatus('approved')}
                disabled={saving}
                title="Force approve this section"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                style={{ color: 'var(--success)', border: '1px solid rgba(74,158,127,0.35)', background: 'rgba(74,158,127,0.08)' }}
              >
                <CheckCircle size={11} />
                Approve
              </button>
            </>
          )}

          {section.status === 'approved' && (
            <button
              onClick={() => updateStatus('pending')}
              disabled={saving}
              title="Reopen for client review"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'var(--surface)' }}
            >
              <RotateCcw size={11} />
              Reopen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
