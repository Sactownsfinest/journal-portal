'use client'

import { useRef } from 'react'
import HTMLFlipBook from 'react-pageflip'
import type { Page } from '@/types'

interface Props {
  pages: Page[]
}

function FlipPage({ page, pageNumber }: { page: Page; pageNumber: number }) {
  const c = page.content

  const baseStyle: React.CSSProperties = {
    background: '#fdf8f0',
    width: '100%',
    height: '100%',
    fontFamily: 'Georgia, serif',
    position: 'relative',
    overflow: 'hidden',
  }

  return (
    <div style={baseStyle}>
      {page.template_type === 'cover' && (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {c.image_url && (
            <img src={c.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center', padding: '32px' }}>
            {c.title_text && <h1 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>{c.title_text}</h1>}
            {c.subtitle_text && <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.7 }}>{c.subtitle_text}</p>}
          </div>
        </div>
      )}

      {page.template_type === 'full_image' && (
        c.image_url
          ? <img src={c.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: '#e8e0d0' }} />
      )}

      {page.template_type === 'text_image' && (
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ width: '40%', order: c.image_side === 'right' ? 2 : 1 }}>
            {c.image_url
              ? <img src={c.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: '#e8e0d0' }} />
            }
          </div>
          <div style={{ flex: 1, padding: 16, order: c.image_side === 'right' ? 1 : 2 }}>
            {c.body_text
              ? <p style={{ fontSize: 9, color: '#3a2e1a', lineHeight: 1.8 }}>{c.body_text}</p>
              : null
            }
          </div>
        </div>
      )}

      {page.template_type === 'prompt_lines' && (
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

      {/* Page number */}
      <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', fontSize: 8, color: '#c8b89a' }}>
        {pageNumber}
      </div>
    </div>
  )
}

export default function FlipbookViewer({ pages }: Props) {
  const bookRef = useRef<any>(null)

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#888]">
        No pages to display
      </div>
    )
  }

  // react-pageflip needs even number of pages for spread view
  const displayPages = pages.length % 2 !== 0 ? [...pages, null] : pages

  return (
    <div className="flex flex-col items-center gap-4">
      {/* @ts-ignore — HTMLFlipBook types are loose */}
      <HTMLFlipBook
        ref={bookRef}
        width={320}
        height={454}
        size="fixed"
        minWidth={200}
        maxWidth={500}
        minHeight={300}
        maxHeight={700}
        showCover={true}
        flippingTime={700}
        style={{ margin: '0 auto' }}
        className="shadow-2xl"
        startPage={0}
        drawShadow={true}
        usePortrait={false}
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
            <div key={page.id}>
              <FlipPage page={page} pageNumber={idx + 1} />
            </div>
          ) : (
            <div key="blank-end" style={{ background: '#fdf8f0', width: '100%', height: '100%' }} />
          )
        )}
      </HTMLFlipBook>

      {/* Navigation */}
      <div className="flex items-center gap-4 text-sm text-[#888]">
        <button
          onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
          className="btn-secondary text-xs px-3 py-1.5"
        >
          ← Prev
        </button>
        <span>{pages.length} pages</span>
        <button
          onClick={() => bookRef.current?.pageFlip()?.flipNext()}
          className="btn-secondary text-xs px-3 py-1.5"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
