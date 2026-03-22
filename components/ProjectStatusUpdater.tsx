'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Send, CheckCircle, RotateCcw, ChevronDown } from 'lucide-react'
import type { ProjectStatus } from '@/types'

interface Props {
  projectId: string
  currentStatus: ProjectStatus
}

export default function ProjectStatusUpdater({ projectId, currentStatus }: Props) {
  const [status, setStatus] = useState<ProjectStatus>(currentStatus)
  const [saving, setSaving] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()

  async function updateStatus(newStatus: ProjectStatus) {
    setSaving(true)
    setShowDropdown(false)
    const supabase = createClient()
    await supabase.from('projects').update({ status: newStatus }).eq('id', projectId)
    setStatus(newStatus)
    setSaving(false)
    router.refresh()
  }

  // Prominent CTA: "Send for Client Review"
  if (status === 'in_progress' || status === 'draft') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateStatus('ready_for_review')}
          disabled={saving}
          className="flex items-center gap-2 font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #8B6BAE, #B090D0)',
            color: '#fff',
            boxShadow: '0 2px 12px rgba(139,107,174,0.35)',
          }}
        >
          <Send size={14} />
          {saving ? 'Updating…' : 'Send for Client Review'}
        </button>
        <StatusDropdown status={status} saving={saving} showDropdown={showDropdown} setShowDropdown={setShowDropdown} updateStatus={updateStatus} />
      </div>
    )
  }

  // Ready for review state
  if (status === 'ready_for_review') {
    return (
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold"
          style={{ background: 'rgba(139,107,174,0.10)', color: 'var(--violet)', border: '1px solid rgba(139,107,174,0.25)' }}
        >
          <CheckCircle size={13} />
          Awaiting Client Approval
        </div>
        <StatusDropdown status={status} saving={saving} showDropdown={showDropdown} setShowDropdown={setShowDropdown} updateStatus={updateStatus} />
      </div>
    )
  }

  // Complete state
  if (status === 'complete') {
    return (
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold"
          style={{ background: 'rgba(74,158,127,0.10)', color: 'var(--success)', border: '1px solid rgba(74,158,127,0.25)' }}
        >
          <CheckCircle size={13} />
          Complete
        </div>
        <StatusDropdown status={status} saving={saving} showDropdown={showDropdown} setShowDropdown={setShowDropdown} updateStatus={updateStatus} />
      </div>
    )
  }

  // Fallback
  return <StatusDropdown status={status} saving={saving} showDropdown={showDropdown} setShowDropdown={setShowDropdown} updateStatus={updateStatus} />
}

function StatusDropdown({ status, saving, showDropdown, setShowDropdown, updateStatus }: {
  status: ProjectStatus
  saving: boolean
  showDropdown: boolean
  setShowDropdown: (v: boolean) => void
  updateStatus: (s: ProjectStatus) => void
}) {
  const ALL_STATUSES: { value: ProjectStatus; label: string }[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'ready_for_review', label: 'Ready for Review' },
    { value: 'complete', label: 'Complete' },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-all"
        style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'var(--surface)' }}
        title="Change status"
      >
        <RotateCcw size={11} />
        <ChevronDown size={11} />
      </button>
      {showDropdown && (
        <div
          className="absolute right-0 top-9 z-20 rounded-xl overflow-hidden min-w-[160px]"
          style={{ background: 'var(--card)', border: '1.5px solid var(--border)', boxShadow: '0 8px 24px rgba(44,36,22,0.12)' }}
        >
          {ALL_STATUSES.filter(s => s.value !== status).map(opt => (
            <button
              key={opt.value}
              onClick={() => updateStatus(opt.value)}
              disabled={saving}
              className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[rgba(184,131,42,0.06)]"
              style={{ color: 'var(--text)' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
