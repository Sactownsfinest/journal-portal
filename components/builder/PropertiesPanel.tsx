'use client'

import { Trash2 } from 'lucide-react'
import type { CanvasElement } from '@/types'
import ColorPicker from './ColorPicker'
import ImageUploader from './ImageUploader'

const FONTS = [
  { label: 'Georgia (Serif)', value: 'Georgia' },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'Arial (Sans)', value: 'Arial, sans-serif' },
  { label: 'Courier (Mono)', value: "'Courier New', monospace" },
]

interface Props {
  element: CanvasElement
  projectId: string
  onChange: (patch: Partial<CanvasElement>) => void
  onDelete: () => void
}

export default function PropertiesPanel({ element, projectId, onChange, onDelete }: Props) {
  const isText = ['heading', 'body', 'scripture', 'prompt'].includes(element.type)

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
          {element.type.charAt(0).toUpperCase() + element.type.slice(1)} Properties
        </p>
        <button
          onClick={onDelete}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          title="Delete element"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Text content */}
      {isText && (
        <div>
          <label className="label">Text</label>
          <textarea
            className="input text-sm resize-none"
            rows={4}
            value={element.text ?? ''}
            onChange={e => onChange({ text: e.target.value })}
            placeholder="Enter text..."
          />
        </div>
      )}

      {/* Image upload */}
      {element.type === 'image' && (
        <div>
          <label className="label">Image</label>
          <ImageUploader
            value={element.image_url}
            onChange={url => onChange({ image_url: url })}
            projectId={projectId}
          />
        </div>
      )}

      {/* Lines count */}
      {element.type === 'lines' && (
        <div>
          <label className="label">Lines ({element.lines_count ?? 8})</label>
          <input
            type="range"
            min={3}
            max={25}
            value={element.lines_count ?? 8}
            onChange={e => onChange({ lines_count: parseInt(e.target.value) })}
            className="w-full"
            style={{ accentColor: 'var(--accent)' }}
          />
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            <span>3</span><span>25</span>
          </div>
        </div>
      )}

      {/* Line color */}
      {element.type === 'lines' && (
        <ColorPicker
          label="Line Color"
          value={element.line_color ?? '#C8B89A'}
          onChange={v => onChange({ line_color: v })}
        />
      )}

      {/* Text styling */}
      {isText && (
        <>
          <div>
            <label className="label">Font</label>
            <select
              className="input text-sm"
              value={element.font_family ?? 'Georgia'}
              onChange={e => onChange({ font_family: e.target.value })}
            >
              {FONTS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Font Size ({element.font_size ?? 12}px)</label>
            <input
              type="range"
              min={8}
              max={60}
              value={element.font_size ?? 12}
              onChange={e => onChange({ font_size: parseInt(e.target.value) })}
              className="w-full"
              style={{ accentColor: 'var(--accent)' }}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              <span>8px</span><span>60px</span>
            </div>
          </div>

          <div>
            <label className="label">Style</label>
            <div className="flex gap-2">
              <button
                onClick={() => onChange({ font_weight: element.font_weight === 'bold' ? 'normal' : 'bold' })}
                className="flex-1 py-1.5 rounded-lg text-sm font-bold transition-all"
                style={{
                  border: '1.5px solid',
                  borderColor: element.font_weight === 'bold' ? 'var(--accent)' : 'var(--border)',
                  color: element.font_weight === 'bold' ? 'var(--accent)' : 'var(--text-muted)',
                  background: element.font_weight === 'bold' ? 'var(--accent-dim)' : 'transparent',
                }}
              >
                Bold
              </button>
              <button
                onClick={() => onChange({ italic: !element.italic })}
                className="flex-1 py-1.5 rounded-lg text-sm italic transition-all"
                style={{
                  border: '1.5px solid',
                  borderColor: element.italic ? 'var(--accent)' : 'var(--border)',
                  color: element.italic ? 'var(--accent)' : 'var(--text-muted)',
                  background: element.italic ? 'var(--accent-dim)' : 'transparent',
                }}
              >
                Italic
              </button>
            </div>
          </div>

          <div>
            <label className="label">Alignment</label>
            <div className="flex gap-2">
              {(['left', 'center', 'right'] as const).map(align => (
                <button
                  key={align}
                  onClick={() => onChange({ text_align: align })}
                  className="flex-1 py-1.5 rounded-lg text-xs capitalize transition-all"
                  style={{
                    border: '1.5px solid',
                    borderColor: element.text_align === align ? 'var(--accent)' : 'var(--border)',
                    color: element.text_align === align ? 'var(--accent)' : 'var(--text-muted)',
                    background: element.text_align === align ? 'var(--accent-dim)' : 'transparent',
                  }}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>

          <ColorPicker
            label="Text Color"
            value={element.text_color ?? '#1A1208'}
            onChange={v => onChange({ text_color: v })}
          />

          <ColorPicker
            label="Background"
            value={element.bg_color ?? ''}
            onChange={v => onChange({ bg_color: v })}
          />
        </>
      )}

      {/* Size & position */}
      <div>
        <label className="label">Size & Position (%)</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'X', key: 'x' as const },
            { label: 'Y', key: 'y' as const },
            { label: 'Width', key: 'w' as const },
            { label: 'Height', key: 'h' as const },
          ].map(({ label, key }) => (
            <div key={key}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <input
                type="number"
                min={0}
                max={100}
                className="input py-1.5 text-sm"
                value={Math.round(element[key])}
                onChange={e => onChange({ [key]: parseFloat(e.target.value) || 0 })}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
