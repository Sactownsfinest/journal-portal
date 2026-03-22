'use client'

import { Type, AlignLeft, Image, AlignJustify, BookMarked, HelpCircle } from 'lucide-react'
import type { ElementType, CanvasElement } from '@/types'

const ELEMENTS: {
  type: ElementType
  label: string
  icon: React.ElementType
  description: string
  defaultProps: Partial<CanvasElement>
}[] = [
  {
    type: 'heading',
    label: 'Heading',
    icon: Type,
    description: 'Large title text',
    defaultProps: {
      w: 80, h: 12,
      text: 'Your Heading',
      font_size: 28,
      font_weight: 'bold',
      font_family: 'Georgia',
      text_color: '#1A1208',
      text_align: 'center',
    },
  },
  {
    type: 'body',
    label: 'Body Text',
    icon: AlignLeft,
    description: 'Paragraph or story',
    defaultProps: {
      w: 80, h: 25,
      text: 'Write your story here...',
      font_size: 11,
      font_weight: 'normal',
      font_family: 'Georgia',
      text_color: '#3A2E1A',
      text_align: 'left',
    },
  },
  {
    type: 'scripture',
    label: 'Scripture',
    icon: BookMarked,
    description: 'Verse or quote block',
    defaultProps: {
      w: 75, h: 18,
      text: '"For I know the plans I have for you..." — Jeremiah 29:11',
      font_size: 10,
      font_weight: 'normal',
      font_family: 'Georgia',
      text_color: '#5C3D11',
      text_align: 'center',
      italic: true,
    },
  },
  {
    type: 'prompt',
    label: 'Prompt',
    icon: HelpCircle,
    description: 'Journal writing prompt',
    defaultProps: {
      w: 80, h: 15,
      text: 'What are three things you are grateful for today?',
      font_size: 11,
      font_weight: 'bold',
      font_family: 'Georgia',
      text_color: '#B8832A',
      text_align: 'left',
    },
  },
  {
    type: 'image',
    label: 'Image',
    icon: Image,
    description: 'Photo or illustration',
    defaultProps: {
      w: 50, h: 35,
      image_url: '',
    },
  },
  {
    type: 'lines',
    label: 'Writing Lines',
    icon: AlignJustify,
    description: 'Ruled lines for writing',
    defaultProps: {
      w: 85, h: 30,
      lines_count: 8,
      line_color: '#C8B89A',
    },
  },
]

interface Props {
  onAdd: (type: ElementType, defaults: Partial<CanvasElement>) => void
}

export default function ElementPalette({ onAdd }: Props) {
  return (
    <div className="p-3">
      <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>
        Add Element
      </p>
      <div className="space-y-1.5">
        {ELEMENTS.map(el => {
          const Icon = el.icon
          return (
            <button
              key={el.type}
              onClick={() => onAdd(el.type, el.defaultProps)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all group"
              style={{ border: '1px solid var(--border)' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(184,131,42,0.4)'
                e.currentTarget.style.background = 'var(--accent-dim)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'var(--accent-dim)', border: '1px solid rgba(184,131,42,0.2)' }}
              >
                <Icon size={13} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{el.label}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{el.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
