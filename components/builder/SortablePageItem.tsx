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
  draft: 'bg-[#555]',
  pending_review: 'bg-[#e8a030]',
  approved: 'bg-[#4caf84]',
  rejected: 'bg-[#e05252]',
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
      style={style}
      className={`flex items-center gap-1.5 rounded-lg px-2 py-2 mb-1 cursor-pointer group transition-colors ${
        isSelected ? 'bg-[#c8a96e]/15 border border-[#c8a96e]/30' : 'hover:bg-[#242424]'
      }`}
      onClick={onSelect}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-[#555] hover:text-[#888] cursor-grab active:cursor-grabbing"
        onClick={e => e.stopPropagation()}
      >
        <GripVertical size={14} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-[#888]">{index + 1}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[page.status]}`} />
          <span className="text-xs text-[#f5f0e8] truncate">{TEMPLATE_LABELS[page.template_type]}</span>
        </div>
        {page.content.title_text && (
          <p className="text-xs text-[#666] truncate mt-0.5">{page.content.title_text}</p>
        )}
        {page.content.prompt_text && (
          <p className="text-xs text-[#666] truncate mt-0.5">{page.content.prompt_text}</p>
        )}
      </div>

      <button
        onClick={e => { e.stopPropagation(); onDelete() }}
        className="text-[#555] hover:text-[#e05252] opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
