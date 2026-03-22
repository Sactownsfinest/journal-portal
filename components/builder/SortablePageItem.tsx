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
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
  onDuplicateAsSection: () => void
  onRename: (name: string) => void
}

export default function SortablePageItem({
  page, index, isSelected, onSelect, onDelete, onDuplicate, onDuplicateAsSection, onRename,
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

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        background: isSelected ? 'rgba(184,131,42,0.08)' : undefined,
        border: isSelected ? '1px solid rgba(184,131,42,0.35)' : '1px solid transparent',
        borderRadius: 10,
        marginBottom: 4,
      }}
      className="group"
    >
      <div className="flex items-center gap-1 px-2 py-2 cursor-pointer" onClick={onSelect}>
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing shrink-0"
          style={{ color: 'var(--border)', touchAction: 'none' }}
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={13} />
        </button>

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
                onDoubleClick={e => { e.stopPropagation(); setEditing(true) }}
                title="Double-click to rename"
              >
                {displayName}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 10, marginLeft: 12 }}>#{index + 1}</p>
        </div>

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
      </div>
    </div>
  )
}
