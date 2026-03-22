'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Copy, CopyPlus } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { Page } from '@/types'

const STATUS_DOT: Record<string, string> = {
  draft: '#C8B89A',
  pending_review: '#FBBF24',
  approved: '#2DD4BF',
  rejected: '#F87171',
}

interface Props {
  page: Page
  index: number
  isSelected: boolean
  // Section display
  sectionColor?: string | null
  sectionName?: string | null
  // Range selection mode
  rangeMode?: boolean
  inPendingRange?: boolean
  isPendingEndpoint?: boolean
  onRangeClick?: () => void
  // Normal actions
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
  onDuplicateAsSection: () => void
  onRename: (name: string) => void
}

export default function SortablePageItem({
  page, index, isSelected,
  sectionColor, sectionName,
  rangeMode, inPendingRange, isPendingEndpoint, onRangeClick,
  onSelect, onDelete, onDuplicate, onDuplicateAsSection, onRename,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id })
  const [editing, setEditing] = useState(false)
  const [nameVal, setNameVal] = useState(page.content.name ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setNameVal(page.content.name ?? '') }, [page.content.name])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  function commitRename() {
    setEditing(false)
    onRename(nameVal.trim())
  }

  const displayName = page.content.name?.trim() || `Page ${index + 1}`

  const handleClick = () => {
    if (rangeMode && onRangeClick) {
      onRangeClick()
    } else {
      onSelect()
    }
  }

  // Border/background based on state
  let borderColor = 'transparent'
  let bg = 'transparent'
  if (isPendingEndpoint) {
    borderColor = 'var(--accent)'
    bg = 'rgba(184,131,42,0.15)'
  } else if (inPendingRange) {
    borderColor = 'rgba(184,131,42,0.4)'
    bg = 'rgba(184,131,42,0.07)'
  } else if (isSelected && !rangeMode) {
    borderColor = 'rgba(184,131,42,0.35)'
    bg = 'rgba(184,131,42,0.08)'
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        background: bg,
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        marginBottom: 4,
        // Colored left bar for section membership
        borderLeft: sectionColor ? `3px solid ${sectionColor}` : `1px solid ${borderColor}`,
        cursor: rangeMode ? 'crosshair' : 'pointer',
      }}
      className="group"
    >
      <div className="flex items-center gap-1 px-2 py-2" onClick={handleClick}>
        {/* Drag handle — hidden in range mode */}
        {!rangeMode && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing shrink-0"
            style={{ color: 'var(--border)', touchAction: 'none' }}
            onClick={e => e.stopPropagation()}
          >
            <GripVertical size={13} />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STATUS_DOT[page.status] }} />
            {editing ? (
              <input
                ref={inputRef}
                value={nameVal}
                onChange={e => setNameVal(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename()
                  if (e.key === 'Escape') { setEditing(false); setNameVal(page.content.name ?? '') }
                }}
                onClick={e => e.stopPropagation()}
                className="text-xs w-full rounded px-1 py-0.5"
                style={{ background: 'white', border: '1px solid var(--accent)', color: 'var(--text)', outline: 'none' }}
              />
            ) : (
              <span
                className="text-xs truncate"
                style={{ color: 'var(--text)' }}
                onDoubleClick={e => { if (!rangeMode) { e.stopPropagation(); setEditing(true) } }}
                title={sectionName ? `Section: ${sectionName}` : 'Double-click to rename'}
              >
                {displayName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5" style={{ marginLeft: 12 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 10 }}>#{index + 1}</p>
            {sectionColor && sectionName && (
              <p style={{ color: sectionColor, fontSize: 9, fontWeight: 600 }} className="truncate">
                {sectionName}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons — hidden in range mode */}
        {!rangeMode && (
          <div
            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={onDuplicate} title="Duplicate page"
              className="w-5 h-5 rounded flex items-center justify-center"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            ><Copy size={11} /></button>
            <button onClick={onDuplicateAsSection} title="Duplicate as 4-page section"
              className="w-5 h-5 rounded flex items-center justify-center"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--violet)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            ><CopyPlus size={11} /></button>
            <button onClick={onDelete} title="Delete page"
              className="w-5 h-5 rounded flex items-center justify-center"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            ><Trash2 size={11} /></button>
          </div>
        )}
      </div>
    </div>
  )
}
