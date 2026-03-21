'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Save, Send, CheckCircle, Clock, FileText, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import type { EngagementLetter } from '@/types'

interface Props {
  projectId: string
  projectTitle: string
  clientName: string
  clientEmail: string
  totalPrice: number
  initialLetter: EngagementLetter | null
}

const DEFAULT_TEMPLATE = (title: string, clientName: string, totalPrice: number) => `Dear ${clientName},

Thank you for choosing us to create your custom journal. We are excited to bring your vision to life. This letter outlines the scope of your project and the terms of our engagement.

PROJECT OVERVIEW
────────────────
Project: ${title}
Client: ${clientName}
Total Investment: $${totalPrice.toLocaleString()}

SCOPE OF WORK
────────────────
Your custom journal will include up to 150 beautifully designed pages. Each section will be crafted to your specifications including writing prompts, scripture, reflection pages, and full-bleed imagery.

Deliverables include:
• Full custom page layout and design
• Up to 5 section types
• Image placement and styling
• Print-ready PDF export (A5, 3mm bleed)
• Digital review portal access

TIMELINE
────────────────
Design and layout will begin once the deposit is received. You will receive access to your review portal where you can approve or request changes to each section. Final delivery is estimated within [X] business days of full approval.

PAYMENT SCHEDULE
────────────────
A deposit (detailed below) is required to begin work. The remaining balance is invoiced in milestones as you approve each section of the journal.

REVISIONS
────────────────
Each section includes one round of revisions. Additional revision rounds are billed at $50/hour.

By accepting this engagement letter, you agree to the above scope and payment terms.

We look forward to creating something beautiful for you.

Warmly,
Shennel
Sactown's Finest`

export default function EngagementLetterEditor({
  projectId,
  projectTitle,
  clientName,
  clientEmail,
  totalPrice,
  initialLetter,
}: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [letter, setLetter] = useState<EngagementLetter | null>(initialLetter)
  const [content, setContent] = useState(initialLetter?.content ?? '')
  const [depositAmount, setDepositAmount] = useState(initialLetter?.deposit_amount ?? Math.round(totalPrice * 0.25))
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [expanded, setExpanded] = useState(!initialLetter || initialLetter.status === 'draft')
  const [error, setError] = useState('')
  const saveTimeout = useRef<NodeJS.Timeout | null>(null)

  function loadTemplate() {
    setContent(DEFAULT_TEMPLATE(projectTitle, clientName, totalPrice))
  }

  async function saveLetter() {
    setSaving(true)
    setError('')

    if (letter) {
      const { error: err } = await supabase
        .from('engagement_letters')
        .update({ content, deposit_amount: depositAmount, updated_at: new Date().toISOString() })
        .eq('id', letter.id)
      if (err) setError(err.message)
    } else {
      const { data, error: err } = await supabase
        .from('engagement_letters')
        .insert({ project_id: projectId, content, deposit_amount: depositAmount })
        .select()
        .single()
      if (err) setError(err.message)
      else setLetter(data as EngagementLetter)
    }

    setSaving(false)
  }

  async function sendToClient() {
    if (!content.trim()) { setError('Write the letter content before sending.'); return }
    setSending(true)
    setError('')

    // Save first
    await saveLetter()

    // Update status to 'sent' and project status to 'awaiting_deposit'
    if (letter) {
      await supabase.from('engagement_letters').update({ status: 'sent' }).eq('id', letter.id)
    } else {
      const { data } = await supabase
        .from('engagement_letters')
        .select('id')
        .eq('project_id', projectId)
        .single()
      if (data) {
        await supabase.from('engagement_letters').update({ status: 'sent' }).eq('id', data.id)
      }
    }

    await supabase.from('projects').update({ status: 'awaiting_deposit' }).eq('id', projectId)

    setSending(false)
    router.refresh()
  }

  const statusConfig = {
    draft: { label: 'Draft', icon: <FileText size={14} />, color: 'var(--text-muted)' },
    sent: { label: 'Sent to Client — Awaiting Acceptance', icon: <Clock size={14} />, color: 'var(--warning)' },
    accepted: { label: 'Accepted by Client', icon: <CheckCircle size={14} />, color: 'var(--success)' },
  }
  const currentStatus = letter?.status ?? 'draft'
  const sc = statusConfig[currentStatus]

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent-dim)', border: '1px solid rgba(212,175,55,0.2)' }}
          >
            <FileText size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="font-semibold">Engagement Letter</p>
            <div className="flex items-center gap-1.5 mt-0.5" style={{ color: sc.color }}>
              {sc.icon}
              <span className="text-xs">{sc.label}</span>
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="pt-4">

            {/* Status bar for accepted */}
            {currentStatus === 'accepted' && letter?.accepted_at && (
              <div
                className="rounded-xl px-4 py-3 mb-4 flex items-center gap-2"
                style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.25)' }}
              >
                <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                <span className="text-sm" style={{ color: 'var(--success)' }}>
                  Client accepted on {new Date(letter.accepted_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}

            {/* Deposit amount */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Deposit Amount ($)</label>
                <input
                  type="number"
                  className="input"
                  value={depositAmount}
                  onChange={e => setDepositAmount(parseFloat(e.target.value) || 0)}
                  disabled={currentStatus === 'accepted'}
                  placeholder="250.00"
                  min={0}
                  step={0.01}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Suggested: ${Math.round(totalPrice * 0.25).toLocaleString()} (25% of total)
                </p>
              </div>
              <div>
                <label className="label">Client</label>
                <div
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  {clientName}<br />
                  <span className="text-xs">{clientEmail}</span>
                </div>
              </div>
            </div>

            {/* Content editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label">Letter Content</label>
                {currentStatus === 'draft' && (
                  <button
                    onClick={loadTemplate}
                    className="text-xs px-2 py-1 rounded-lg transition-colors"
                    style={{ color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid rgba(212,175,55,0.2)' }}
                  >
                    Load Template
                  </button>
                )}
              </div>
              <textarea
                className="input font-mono text-sm"
                style={{
                  minHeight: '320px',
                  resize: 'vertical',
                  fontFamily: 'Georgia, serif',
                  lineHeight: '1.7',
                  opacity: currentStatus === 'accepted' ? 0.7 : 1,
                }}
                value={content}
                onChange={e => setContent(e.target.value)}
                disabled={currentStatus === 'accepted'}
                placeholder="Write your engagement letter here, or click 'Load Template' to start from a template…"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm rounded-xl px-3 py-2"
                style={{ color: 'var(--danger)', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {/* Actions */}
            {currentStatus !== 'accepted' && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={saveLetter}
                  disabled={saving}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Save size={14} />
                  {saving ? 'Saving…' : 'Save Draft'}
                </button>

                {currentStatus === 'draft' && (
                  <button
                    onClick={sendToClient}
                    disabled={sending || !content.trim()}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Send size={14} />
                    {sending ? 'Sending…' : 'Send to Client'}
                  </button>
                )}

                {currentStatus === 'sent' && (
                  <div
                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl"
                    style={{ color: 'var(--warning)', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}
                  >
                    <Clock size={14} />
                    Waiting for client to accept
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
