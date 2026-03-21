'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { ProjectStatus } from '@/types'

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'ready_for_review', label: 'Ready for Review' },
  { value: 'complete', label: 'Complete' },
]

interface Props {
  projectId: string
  currentStatus: ProjectStatus
}

export default function ProjectStatusUpdater({ projectId, currentStatus }: Props) {
  const [status, setStatus] = useState<ProjectStatus>(currentStatus)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as ProjectStatus
    setSaving(true)
    setStatus(newStatus)
    const supabase = createClient()
    await supabase.from('projects').update({ status: newStatus }).eq('id', projectId)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      {saving && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Saving…</span>}
      <select
        className="text-xs rounded-lg px-2 py-1 focus:outline-none"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        value={status}
        onChange={handleChange}
      >
        {STATUS_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
