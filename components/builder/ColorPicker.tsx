'use client'

const SWATCHES = [
  '#FFFFFF', '#FAF8F3', '#FFF6E0', '#F3EEF9', '#E8F7F2',
  '#1A1208', '#3A2E1A', '#5C3D11', '#4A2D6B', '#1B4D3E',
  '#B8832A', '#D4A84B', '#8B6BAE', '#4A9E7F', '#C0524A',
  '#E8D5B7', '#D4B896', '#C8A870', '#9F7EC5', '#6EC4A4',
  '#F5F0E8', '#EDE0C8', '#DDD0B8', '#C9B99A', '#A89070',
]

interface Props {
  value: string
  onChange: (color: string) => void
  label?: string
}

export default function ColorPicker({ value, onChange, label }: Props) {
  return (
    <div>
      {label && (
        <label className="label mb-2">{label}</label>
      )}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {SWATCHES.map(color => (
          <button
            key={color}
            onClick={() => onChange(color)}
            title={color}
            className="w-6 h-6 rounded-md border transition-transform hover:scale-110"
            style={{
              background: color,
              borderColor: value === color ? 'var(--accent)' : 'var(--border)',
              boxShadow: value === color ? '0 0 0 2px var(--accent)' : undefined,
              outline: color === '#FFFFFF' ? '1px solid var(--border)' : undefined,
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#FFFFFF'}
          onChange={e => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg cursor-pointer border"
          style={{ borderColor: 'var(--border)', padding: '1px' }}
        />
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="#FFFFFF"
          className="input py-1.5 text-xs font-mono flex-1"
        />
      </div>
    </div>
  )
}
