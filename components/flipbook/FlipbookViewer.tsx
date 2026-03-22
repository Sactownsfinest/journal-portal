'use client'

import { useRef, useState, useEffect } from 'react'
import HTMLFlipBook from 'react-pageflip'
import type { Page } from '@/types'

// Native canvas design size — must match DesignerCanvas
const CANVAS_W = 420
const CANVAS_H = 595
const ASPECT = CANVAS_H / CANVAS_W   // ≈ 1.417

interface Props {
  pages: Page[]
}

function FlipPage({ page, pageNumber, displayW, displayH }: {
  page: Page
  pageNumber: number
  displayW: number
  displayH: number
}) {
  const c = page.content
  const isCanvas = !!(c.elements && c.elements.length > 0)
  const canvasScale = Math.min(displayW / CANVAS_W, displayH / CANVAS_H)

  const baseStyle: React.CSSProperties = {
    background: '#fdf8f0',
    width: displayW,
    height: displayH,
    fontFamily: 'Georgia, serif',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
  }

  return (
    <div style={baseStyle}>

      {/* ── Legacy template types ── */}
      {!isCanvas && page.template_type === 'cover' && (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {c.image_url && (
            <img src={c.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center', padding: '32px' }}>
            {c.title_text && <h1 style={{ fontSize: Math.round(22 * canvasScale), fontWeight: 'bold', marginBottom: 8 }}>{c.title_text}</h1>}
            {c.subtitle_text && <p style={{ fontSize: Math.round(11 * canvasScale), letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.7 }}>{c.subtitle_text}</p>}
          </div>
        </div>
      )}

      {!isCanvas && page.template_type === 'full_image' && (
        c.image_url
          ? <img src={c.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: '#e8e0d0' }} />
      )}

      {!isCanvas && page.template_type === 'text_image' && (
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ width: '40%', order: c.image_side === 'right' ? 2 : 1 }}>
            {c.image_url
              ? <img src={c.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: '#e8e0d0' }} />
            }
          </div>
          <div style={{ flex: 1, padding: 16, order: c.image_side === 'right' ? 1 : 2 }}>
            {c.body_text && <p style={{ fontSize: 9, color: '#3a2e1a', lineHeight: 1.8 }}>{c.body_text}</p>}
          </div>
        </div>
      )}

      {!isCanvas && page.template_type === 'prompt_lines' && (
        <div style={{ padding: 24 }}>
          {c.prompt_text && (
            <p style={{ fontSize: 10, fontStyle: 'italic', color: '#3a2e1a', marginBottom: 20, lineHeight: 1.6 }}>
              {c.prompt_text}
            </p>
          )}
          {Array.from({ length: c.lines_count ?? 15 }).map((_, i) => (
            <div key={i} style={{ height: 1, background: 'rgba(200,185,154,0.6)', marginBottom: 18 }} />
          ))}
        </div>
      )}

      {/* ── Free-form canvas pages ── */}
      {isCanvas && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: CANVAS_W,
            height: CANVAS_H,
            transformOrigin: 'top left',
            transform: `scale(${canvasScale})`,
            background: c.bg_color || '#fdf8f0',
            overflow: 'hidden',
          }}
        >
          {c.elements!.map(el => {
            const base: React.CSSProperties = {
              position: 'absolute',
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.w}%`,
              height: `${el.h}%`,
              overflow: 'hidden',
              boxSizing: 'border-box',
            }

            if (['heading', 'body', 'scripture', 'prompt'].includes(el.type)) {
              const bgStyle = el.bg_color
                ? el.opacity !== undefined && el.opacity < 1
                  ? `${el.bg_color}${Math.round((el.opacity ?? 1) * 255).toString(16).padStart(2, '0')}`
                  : el.bg_color
                : 'transparent'
              return (
                <div key={el.id} style={{ ...base, background: bgStyle, display: 'flex', alignItems: 'flex-start', padding: '4px' }}>
                  <p style={{
                    fontFamily: el.font_family || 'Georgia, serif',
                    fontSize: `${el.font_size || 12}px`,
                    fontWeight: el.font_weight || 'normal',
                    fontStyle: el.italic ? 'italic' : 'normal',
                    color: el.text_color || '#1A1208',
                    textAlign: el.text_align || 'left',
                    width: '100%',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                  }}>
                    {el.text || ''}
                  </p>
                </div>
              )
            }

            if (el.type === 'image') {
              return (
                <div key={el.id} style={{ ...base, background: '#E8E0D0' }}>
                  {el.image_url && <img src={el.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: el.opacity ?? 1 }} />}
                </div>
              )
            }

            if (el.type === 'lines') {
              const count = el.lines_count ?? 8
              return (
                <div key={el.id} style={{ ...base, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px 0' }}>
                  {Array.from({ length: count }).map((_, i) => (
                    <div key={i} style={{ height: 1, background: el.line_color || '#C8B89A', width: '100%' }} />
                  ))}
                </div>
              )
            }

            return null
          })}
        </div>
      )}

      {/* Page number */}
      <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0, textAlign: 'center', fontSize: 8, color: '#c8b89a', zIndex: 10 }}>
        {pageNumber}
      </div>
    </div>
  )
}

export default function FlipbookViewer({ pages }: Props) {
  const bookRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState<{ w: number; h: number; portrait: boolean } | null>(null)

  useEffect(() => {
    function compute() {
      const containerW = containerRef.current?.clientWidth ?? window.innerWidth
      const PADDING = 32 // total horizontal padding inside the container

      // On narrow screens use portrait (single page), on wide use spread (two pages)
      const usePortrait = containerW < 560

      let pageW: number
      if (usePortrait) {
        // Single page — fill available width
        pageW = Math.min(containerW - PADDING, 360)
      } else {
        // Two-page spread — each page gets half the container
        pageW = Math.min(Math.floor((containerW - PADDING) / 2), 360)
      }

      const pageH = Math.round(pageW * ASPECT)
      setDims({ w: pageW, h: pageH, portrait: usePortrait })
    }

    compute()

    const ro = new ResizeObserver(compute)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  if (pages.length === 0) {
    return <div className="flex items-center justify-center h-64 text-[#888]">No pages to display</div>
  }

  // react-pageflip needs even number of pages for spread view
  const displayPages = pages.length % 2 !== 0 ? [...pages, null] : pages

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center gap-4">
      {dims && (
        <>
          {/* @ts-ignore */}
          <HTMLFlipBook
            ref={bookRef}
            width={dims.w}
            height={dims.h}
            size="fixed"
            minWidth={dims.w}
            maxWidth={dims.w}
            minHeight={dims.h}
            maxHeight={dims.h}
            showCover={true}
            flippingTime={700}
            style={{ margin: '0 auto' }}
            className="shadow-2xl"
            startPage={0}
            drawShadow={true}
            usePortrait={dims.portrait}
            startZIndex={0}
            autoSize={false}
            clickEventForward={true}
            useMouseEvents={true}
            swipeDistance={30}
            showPageCorners={true}
            disableFlipByClick={false}
            mobileScrollSupport={true}
          >
            {displayPages.map((page, idx) =>
              page ? (
                <div key={page.id} style={{ width: dims.w, height: dims.h, overflow: 'hidden' }}>
                  <FlipPage page={page} pageNumber={idx + 1} displayW={dims.w} displayH={dims.h} />
                </div>
              ) : (
                <div key="blank-end" style={{ background: '#fdf8f0', width: dims.w, height: dims.h }} />
              )
            )}
          </HTMLFlipBook>

          <div className="flex items-center gap-4 text-sm text-[#888]">
            <button onClick={() => bookRef.current?.pageFlip()?.flipPrev()} className="btn-secondary text-xs px-3 py-1.5">
              ← Prev
            </button>
            <span>{pages.length} pages</span>
            <button onClick={() => bookRef.current?.pageFlip()?.flipNext()} className="btn-secondary text-xs px-3 py-1.5">
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  )
}
