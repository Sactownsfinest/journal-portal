'use client'

import { X } from 'lucide-react'
import type { TemplateType } from '@/types'

const TEMPLATES: { type: TemplateType; label: string; description: string; preview: string }[] = [
  {
    type: 'cover',
    label: 'Cover Page',
    description: 'Full bleed image with title and subtitle text overlay',
    preview: '🖼️',
  },
  {
    type: 'full_image',
    label: 'Full Image',
    description: 'Full bleed image, no text',
    preview: '📷',
  },
  {
    type: 'text_image',
    label: 'Text + Image',
    description: 'Image on left or right with body text',
    preview: '📝',
  },
  {
    type: 'prompt_lines',
    label: 'Prompt + Lines',
    description: 'Writing prompt at top with ruled lines below',
    preview: '✍️',
  },
  {
    type: 'blank',
    label: 'Blank Page',
    description: 'Empty page for notes or illustrations',
    preview: '⬜',
  },
]

interface Props {
  onSelect: (template: TemplateType) => void
  onClose: () => void
}

export default function TemplateSelector({ onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg card-glow">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold gold-text">Choose Page Template</h2>
          <button
            onClick={onClose}
            className="transition-colors hover:text-[#F8F4E3]"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {TEMPLATES.map(t => (
            <button
              key={t.type}
              onClick={() => onSelect(t.type)}
              className="flex items-center gap-4 p-4 rounded-xl text-left group transition-all"
              style={{ border: '1px solid var(--border)' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)'
                e.currentTarget.style.background = 'var(--accent-dim)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span className="text-3xl w-10 text-center">{t.preview}</span>
              <div>
                <p className="font-medium transition-colors group-hover:text-[#D4AF37]" style={{ color: 'var(--text)' }}>
                  {t.label}
                </p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
