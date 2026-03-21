'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import type { Page } from '@/types'

const TEMPLATE_LABELS: Record<string, string> = {
  cover: 'Cover',
  full_image: 'Full Image',
  text_image: 'Text + Image',
  prompt_lines: 'Prompt',
  blank: 'Blank',
}

const STATUS_DOT: Record<string, string> = {
  draft: '#7A9AB8',
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
}

export default function SortablePageItem({ page, index, isSelected, onSelect, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: isSelected ? 'rgba(212,175,55,0.1)' : undefined,
        border: isSelected ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
      }}
      className="flex items-center gap-1.5 rounded-lg px-2 py-2 mb-1 cursor-pointer group transition-all hover:bg-[rgba(212,175,55,0.05)]"
      onClick={onSelect}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing transition-colors"
        style={{ color: 'var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        <GripVertical size={14} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{index + 1}</span>
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: STATUS_DOT[page.status] }}
          />
          <span className="text-xs truncate" style={{ color: 'var(--text)' }}>
            {TEMPLATE_LABELS[page.template_type]}
          </span>
        </div>
        {page.content.title_text && (
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {page.content.title_text}
          </p>
        )}
        {page.content.prompt_text && (
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {page.content.prompt_text}
          </p>
        )}
      </div>

      <button
        onClick={e => { e.stopPropagation(); onDelete() }}
        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#F87171]"
        style={{ color: 'var(--text-muted)' }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
