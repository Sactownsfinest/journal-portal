'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { RotateCcw, CheckCircle, Pencil, Eye, Trash2, X, BookOpen, Send } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { Page, Section } from '@/types'

const FlipbookViewer = dynamic(() => import('@/components/flipbook/FlipbookViewer'), { ssr: false })

const TEMPLATE_LABELS: Record<string, { label: string; color: string }> = {
  cover:        { label: 'Cover',    color: '#B8832A' },
  full_image:   { label: 'Image',    color: '#7B2FBE' },
  text_image:   { label: 'Text+Img', color: '#2D74A7' },
  prompt_lines: { label: 'Prompt',   color: '#2DA87F' },
  blank:        { label: 'Blank',    color: '#555' },
}

const STATUS_CONFIG = {
  draft:    { color: '#8A9BB8',           bg: 'rgba(138,155,184,0.12)', label: 'Draft' },
  pending:  { color: 'var(--text-muted)', bg: 'rgba(42,74,107,0.4)',    label: 'Sent to Client' },
  approved: { color: 'var(--success)',    bg: 'rgba(45,212,191,0.1)',   label: 'Approved' },
  rejected: { color: 'var(--danger)',     bg: 'rgba(248,113,113,0.1)', label: 'Rejected' },
}

interface Props {
  section: Section
  pages: Pick<Page, 'id' | 'order_index' | 'template_type' | 'content'>[]
  allSections: Section[]
}

export default function SectionRow({ section, pages, allSections }: Props) {
  const [saving, setSaving] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const router = useRouter()
  const s = STATUS_CONFIG[section.status] ?? STATUS_CONFIG.draft

  const sectionPages = pages.filter(p => {
    const n = p.order_index + 1
    return n >= section.page_start && n <= section.page_end
  })

  async function sendToClient() {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('sections')
      .update({ status: 'pending' })
      .eq('id', section.id)
    setSaving(false)
    router.refresh()
  }

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

  async function handleDelete() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('sections').delete().eq('id', section.id)
    setSaving(false)
    setConfirmDelete(false)
    router.refresh()
  }

  return (
    <>
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium" style={{ color: 'var(--accent)' }}>{section.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: s.color, background: s.bg }}>
                {s.label}
              </span>
            </div>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Pages {section.page_start}–{section.page_end} · {sectionPages.length} page{sectionPages.length !== 1 ? 's' : ''}
            </p>
            {section.client_notes && (
              <p className="text-sm mt-2 rounded-lg px-3 py-2"
                style={{ color: 'var(--warning)', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                Client note: &ldquo;{section.client_notes}&rdquo;
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {section.reviewed_at && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {new Date(section.reviewed_at).toLocaleDateString()}
              </p>
            )}

            {/* Send to Client — draft only */}
            {section.status === 'draft' && (
              <button onClick={sendToClient} disabled={saving}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-50"
                style={{ color: '#fff', background: 'var(--accent)', border: '1px solid var(--accent)' }}>
                <Send size={12} /> {saving ? 'Sending…' : 'Send to Client'}
              </button>
            )}

            {/* Preview */}
            <button
              onClick={() => setShowPreview(true)}
              title="Preview pages in this section"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{ color: 'var(--accent)', border: '1px solid rgba(184,131,42,0.3)', background: 'rgba(184,131,42,0.06)' }}
            >
              <Eye size={12} /> Preview
            </button>

            {/* Edit */}
            <button
              onClick={() => setShowEdit(true)}
              title="Edit section"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'var(--surface)' }}
            >
              <Pencil size={12} /> Edit
            </button>

            {/* Status overrides */}
            {section.status === 'rejected' && (
              <>
                <button onClick={() => updateStatus('pending')} disabled={saving}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                  style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <RotateCcw size={11} /> Reset
                </button>
                <button onClick={() => updateStatus('approved')} disabled={saving}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                  style={{ color: 'var(--success)', border: '1px solid rgba(74,158,127,0.35)', background: 'rgba(74,158,127,0.08)' }}>
                  <CheckCircle size={11} /> Approve
                </button>
              </>
            )}

            {section.status === 'approved' && (
              <button onClick={() => updateStatus('pending')} disabled={saving}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <RotateCcw size={11} /> Reopen
              </button>
            )}

            {/* Delete */}
            <button
              onClick={() => setConfirmDelete(true)}
              title="Delete section"
              className="p-1.5 rounded-lg transition-all"
              style={{ color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.06)' }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          section={section}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Edit Modal */}
      {showEdit && (
        <EditModal
          section={section}
          pages={pages}
          allSections={allSections.filter(s => s.id !== section.id)}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); router.refresh() }}
        />
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm card space-y-4">
            <h3 className="font-bold" style={{ color: 'var(--danger)' }}>Delete &ldquo;{section.name}&rdquo;?</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              This will permanently remove the section. Client approval data will be lost.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 py-2 px-4 rounded-xl font-semibold text-sm transition-all"
                style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.3)' }}>
                {saving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Preview Modal ────────────────────────────────────────────────────────────
function PreviewModal({ section, onClose }: { section: Section; onClose: () => void }) {
  const [pages, setPages] = useState<Page[] | null>(null)
  const supabase = createClient()

  // Fetch fresh pages from DB when modal opens — avoids stale server-rendered data
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('pages')
        .select('*')
        .eq('project_id', section.project_id)
        .gte('order_index', section.page_start - 1)
        .lte('order_index', section.page_end - 1)
        .order('order_index')
      setPages((data ?? []) as Page[])
    }
    load()
  }, [section.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--card)', border: '1.5px solid var(--border)', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent-dim)', border: '1px solid rgba(184,131,42,0.2)' }}>
              <BookOpen size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h3 className="font-bold" style={{ color: 'var(--accent)' }}>{section.name}</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Pages {section.page_start}–{section.page_end}
                {pages !== null && ` · ${pages.length} pages`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Flipbook */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center" style={{ background: 'var(--bg)' }}>
          {pages === null ? (
            <div className="flex flex-col items-center gap-3" style={{ color: 'var(--text-muted)' }}>
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
              <p className="text-sm">Loading pages…</p>
            </div>
          ) : pages.length === 0 ? (
            <p className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
              No pages in this range yet.
            </p>
          ) : (
            <FlipbookViewer pages={pages} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({
  section, pages, allSections, onClose, onSaved,
}: {
  section: Section
  pages: Pick<Page, 'id' | 'order_index' | 'template_type' | 'content'>[]
  allSections: Section[]
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(section.name)
  const [rangeStart, setRangeStart] = useState<number | null>(section.page_start)
  const [rangeEnd, setRangeEnd] = useState<number | null>(section.page_end)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handlePageClick(pageNum: number) {
    if (rangeStart === null) {
      setRangeStart(pageNum); setRangeEnd(null)
    } else if (rangeEnd === null) {
      if (pageNum === rangeStart) {
        setRangeStart(null)
      } else {
        const lo = Math.min(pageNum, rangeStart)
        const hi = Math.max(pageNum, rangeStart)
        setRangeStart(lo); setRangeEnd(hi)
      }
    } else {
      setRangeStart(pageNum); setRangeEnd(null)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const start = rangeStart
    const end = rangeEnd ?? rangeStart

    if (!start || !end) { setError('Select a page range'); return }
    if (!name.trim()) { setError('Name is required'); return }

    const overlap = allSections.find(s => !(end < s.page_start || start > s.page_end))
    if (overlap) {
      setError(`Overlaps with "${overlap.name}" (pages ${overlap.page_start}–${overlap.page_end})`)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('sections')
      .update({ name: name.trim(), page_start: start, page_end: end })
      .eq('id', section.id)

    if (err) { setError(err.message); setLoading(false); return }
    onSaved()
  }

  const selStart = rangeStart !== null && rangeEnd !== null ? Math.min(rangeStart, rangeEnd) : rangeStart
  const selEnd   = rangeStart !== null && rangeEnd !== null ? Math.max(rangeStart, rangeEnd) : null
  const pageCount = selStart && selEnd ? selEnd - selStart + 1 : selStart ? 1 : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--card)', border: '1.5px solid var(--border)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-bold" style={{ color: 'var(--accent)' }}>Edit Section</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Name */}
            <div>
              <label className="label">Section Name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} />
            </div>

            {/* Visual page picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Page Range</label>
                {pageCount > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                    {selStart}{selEnd && selEnd !== selStart ? `–${selEnd}` : ''} · {pageCount} page{pageCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {pages.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No pages in project yet.</p>
              ) : (
                <>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    Click a page to set start, then click another to set end.
                  </p>
                  <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}>
                    {pages.map(p => {
                      const pageNum = p.order_index + 1
                      const inRange  = selStart !== null && selEnd !== null
                        ? pageNum >= selStart && pageNum <= selEnd
                        : pageNum === selStart
                      const isStart  = pageNum === selStart
                      const isEnd    = selEnd !== null && pageNum === selEnd
                      const inOther  = allSections.some(s => pageNum >= s.page_start && pageNum <= s.page_end)
                      const tpl = TEMPLATE_LABELS[p.template_type] ?? { label: p.template_type, color: '#888' }

                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handlePageClick(pageNum)}
                          title={p.content?.name ?? `Page ${pageNum} · ${tpl.label}`}
                          className="rounded-xl text-center transition-all py-2 px-1 relative"
                          style={{
                            border: '1.5px solid',
                            borderColor: inRange ? 'var(--accent)' : inOther ? 'rgba(248,113,113,0.4)' : 'var(--border)',
                            background: inRange ? 'var(--accent-dim)' : inOther ? 'rgba(248,113,113,0.06)' : 'var(--surface)',
                            opacity: inOther && !inRange ? 0.6 : 1,
                          }}
                        >
                          <div className="text-base font-bold" style={{ color: inRange ? 'var(--accent)' : 'var(--text)' }}>
                            {pageNum}
                          </div>
                          <div className="text-[9px] font-semibold mt-0.5 truncate"
                            style={{ color: inRange ? 'var(--accent)' : tpl.color }}>
                            {tpl.label}
                          </div>
                          {(isStart || isEnd) && (
                            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full"
                              style={{ background: 'var(--accent)', border: '1.5px solid var(--card)' }} />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading || !name.trim() || pageCount === 0}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
