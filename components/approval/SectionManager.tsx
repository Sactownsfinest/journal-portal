'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import type { Page, Section } from '@/types'

const TEMPLATE_LABELS: Record<string, { label: string; color: string }> = {
  cover:        { label: 'Cover',   color: '#B8832A' },
  full_image:   { label: 'Image',   color: '#7B2FBE' },
  text_image:   { label: 'Text+Img',color: '#2D74A7' },
  prompt_lines: { label: 'Prompt',  color: '#2DA87F' },
  blank:        { label: 'Blank',   color: '#555' },
}

interface Props {
  projectId: string
  pages: Pick<Page, 'id' | 'order_index' | 'template_type' | 'content'>[]
  existingSections: Section[]
}

export default function SectionManager({ projectId, pages, existingSections }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [rangeStart, setRangeStart] = useState<number | null>(null)
  const [rangeEnd, setRangeEnd] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function handlePageClick(pageNum: number) {
    if (rangeStart === null) {
      setRangeStart(pageNum)
      setRangeEnd(null)
    } else if (rangeEnd === null) {
      if (pageNum === rangeStart) {
        setRangeStart(null)
      } else {
        setRangeEnd(pageNum < rangeStart ? rangeStart : pageNum)
        if (pageNum < rangeStart) setRangeStart(pageNum)
      }
    } else {
      // Reset and start new selection
      setRangeStart(pageNum)
      setRangeEnd(null)
    }
  }

  function close() {
    setOpen(false)
    setName('')
    setRangeStart(null)
    setRangeEnd(null)
    setError('')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const start = rangeStart
    const end = rangeEnd ?? rangeStart

    if (!start || !end) { setError('Select a page range first'); return }
    if (!name.trim()) { setError('Section name is required'); return }

    // Check for overlaps with existing sections
    const overlap = existingSections.find(s =>
      !(end < s.page_start || start > s.page_end)
    )
    if (overlap) {
      setError(`Overlaps with existing section "${overlap.name}" (pages ${overlap.page_start}–${overlap.page_end})`)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.from('sections').insert({
      project_id: projectId,
      name: name.trim(),
      page_start: start,
      page_end: end,
      status: 'draft',
    })

    if (err) {
      setError(err.message)
    } else {
      close()
      router.refresh()
    }
    setLoading(false)
  }

  const selStart = rangeStart !== null && rangeEnd !== null ? Math.min(rangeStart, rangeEnd) : rangeStart
  const selEnd   = rangeStart !== null && rangeEnd !== null ? Math.max(rangeStart, rangeEnd) : null
  const pageCount = selStart && selEnd ? selEnd - selStart + 1 : selStart ? 1 : 0

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary flex items-center gap-1.5 text-sm">
        <Plus size={14} />
        Add Section
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
            style={{ background: 'var(--card)', border: '1.5px solid var(--border)', maxHeight: '90vh' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <h3 className="font-bold" style={{ color: 'var(--accent)' }}>Add Section</h3>
              <button onClick={close} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                {/* Name */}
                <div>
                  <label className="label">Section Name</label>
                  <input
                    className="input"
                    placeholder="e.g. Introduction, Chapter 1, Reflection…"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                {/* Visual page picker */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label mb-0">Select Page Range</label>
                    {pageCount > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                        {selStart}{selEnd && selEnd !== selStart ? `–${selEnd}` : ''} · {pageCount} page{pageCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {pages.length === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      No pages yet — add pages in the builder first.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                        Click a page to set start, then click another to set end. Click again to reset.
                      </p>
                      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}>
                        {pages.map(p => {
                          const pageNum = p.order_index + 1
                          const inRange  = selStart !== null && selEnd !== null
                            ? pageNum >= selStart && pageNum <= selEnd
                            : pageNum === selStart
                          const isStart  = pageNum === selStart
                          const isEnd    = selEnd !== null && pageNum === selEnd
                          const inOther  = existingSections.some(s =>
                            pageNum >= s.page_start && pageNum <= s.page_end
                          )
                          const tpl = TEMPLATE_LABELS[p.template_type] ?? { label: p.template_type, color: '#888' }
                          const pageName = p.content?.name

                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handlePageClick(pageNum)}
                              title={pageName ?? `Page ${pageNum} · ${tpl.label}`}
                              className="rounded-xl text-center transition-all py-2 px-1 relative"
                              style={{
                                border: '1.5px solid',
                                borderColor: inRange
                                  ? 'var(--accent)'
                                  : inOther
                                  ? 'rgba(248,113,113,0.4)'
                                  : 'var(--border)',
                                background: inRange
                                  ? 'var(--accent-dim)'
                                  : inOther
                                  ? 'rgba(248,113,113,0.06)'
                                  : 'var(--surface)',
                                opacity: inOther && !inRange ? 0.6 : 1,
                              }}
                            >
                              <div className="text-base font-bold" style={{ color: inRange ? 'var(--accent)' : 'var(--text)' }}>
                                {pageNum}
                              </div>
                              <div
                                className="text-[9px] font-semibold mt-0.5 truncate"
                                style={{ color: inRange ? 'var(--accent)' : tpl.color }}
                              >
                                {tpl.label}
                              </div>
                              {(isStart || isEnd) && (
                                <div
                                  className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full"
                                  style={{ background: 'var(--accent)', border: '1.5px solid var(--card)' }}
                                />
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {/* Legend */}
                      <div className="flex flex-wrap gap-3 mt-3">
                        {Object.entries(TEMPLATE_LABELS).map(([key, val]) => (
                          <span key={key} className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <span className="w-2 h-2 rounded-full" style={{ background: val.color }} />
                            {val.label}
                          </span>
                        ))}
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(248,113,113,0.5)' }} />
                          In another section
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 py-4 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={close} className="btn-secondary flex-1">Cancel</button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={loading || !name.trim() || pageCount === 0}
                >
                  {loading ? 'Adding…' : `Add Section${pageCount > 0 ? ` (${pageCount} pages)` : ''}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
