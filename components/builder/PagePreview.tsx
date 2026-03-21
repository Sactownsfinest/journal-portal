import type { Page } from '@/types'

// A5 aspect ratio: 148:210 ≈ 0.705
// Preview at 280×397px

export default function PagePreview({ page }: { page: Page }) {
  const c = page.content

  return (
    <div
      className="relative overflow-hidden shadow-2xl"
      style={{
        width: 280,
        height: 397,
        background: '#fdf8f0',
        borderRadius: 4,
        fontFamily: 'Georgia, serif',
      }}
    >
      {page.template_type === 'cover' && (
        <div className="relative w-full h-full">
          {c.image_url ? (
            <img src={c.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#2a1f0a] to-[#1a1208]" />
          )}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center text-white">
            {c.title_text && (
              <h1 className="text-xl font-bold leading-tight mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                {c.title_text}
              </h1>
            )}
            {c.subtitle_text && (
              <p className="text-xs text-white/70 tracking-widest uppercase">{c.subtitle_text}</p>
            )}
          </div>
        </div>
      )}

      {page.template_type === 'full_image' && (
        c.image_url ? (
          <img src={c.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#e8e0d0] flex items-center justify-center">
            <span className="text-4xl text-[#c8b89a]">📷</span>
          </div>
        )
      )}

      {page.template_type === 'text_image' && (
        <div className={`flex h-full ${c.image_side === 'right' ? 'flex-row' : 'flex-row'}`}>
          <div className={`w-2/5 ${c.image_side === 'right' ? 'order-2' : 'order-1'}`}>
            {c.image_url ? (
              <img src={c.image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#e8e0d0] flex items-center justify-center">
                <span className="text-2xl text-[#c8b89a]">📷</span>
              </div>
            )}
          </div>
          <div className={`flex-1 p-4 ${c.image_side === 'right' ? 'order-1' : 'order-2'}`}>
            {c.body_text ? (
              <p className="text-[9px] text-[#3a2e1a] leading-relaxed">{c.body_text}</p>
            ) : (
              <div className="space-y-1.5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-px bg-[#c8b89a]/40 w-full" />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {page.template_type === 'prompt_lines' && (
        <div className="p-6">
          {c.prompt_text && (
            <p className="text-[9px] text-[#3a2e1a] mb-5 italic leading-relaxed font-medium">
              {c.prompt_text}
            </p>
          )}
          <div className="space-y-3">
            {Array.from({ length: Math.min(c.lines_count ?? 15, 20) }).map((_, i) => (
              <div key={i} className="h-px bg-[#c8b89a]/60 w-full" />
            ))}
          </div>
        </div>
      )}

      {page.template_type === 'blank' && (
        <div className="w-full h-full" />
      )}
    </div>
  )
}
