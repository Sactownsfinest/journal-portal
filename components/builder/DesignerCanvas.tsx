'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import type { CanvasElement, PageContent } from '@/types'

// A5 aspect ratio 148:210
const CANVAS_W = 420
const CANVAS_H = 595

interface Props {
  content: PageContent
  selectedId: string | null
  onSelect: (id: string | null) => void
  onElementChange: (id: string, patch: Partial<CanvasElement>) => void
}

function renderElement(el: CanvasElement, isSelected: boolean) {
  const base: React.CSSProperties = {
    position: 'absolute',
    left: `${el.x}%`,
    top: `${el.y}%`,
    width: `${el.w}%`,
    height: `${el.h}%`,
    boxSizing: 'border-box',
    cursor: 'move',
    outline: isSelected ? '2px solid #B8832A' : '1px dashed transparent',
    outlineOffset: '2px',
    overflow: 'hidden',
  }

  if (['heading', 'body', 'scripture', 'prompt'].includes(el.type)) {
    // Convert bg_color + opacity into rgba if needed
    const bgStyle = el.bg_color
      ? el.opacity !== undefined && el.opacity < 1
        ? `${el.bg_color}${Math.round((el.opacity ?? 1) * 255).toString(16).padStart(2, '0')}`
        : el.bg_color
      : 'transparent'
    return (
      <div
        style={{
          ...base,
          background: bgStyle,
          display: 'flex',
          alignItems: 'flex-start',
          padding: '4px',
        }}
      >
        <p
          style={{
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
          }}
        >
          {el.text || ''}
        </p>
      </div>
    )
  }

  if (el.type === 'image') {
    return (
      <div style={{ ...base, background: '#E8E0D0' }}>
        {el.image_url ? (
          <img src={el.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: el.opacity ?? 1 }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C8B89A', fontSize: 11 }}>
            📷 Click to upload
          </div>
        )}
      </div>
    )
  }

  if (el.type === 'lines') {
    const count = el.lines_count ?? 8
    return (
      <div style={{ ...base, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px 0' }}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            style={{ height: 1, background: el.line_color || '#C8B89A', width: '100%' }}
          />
        ))}
      </div>
    )
  }

  return null
}

export default function DesignerCanvas({ content, selectedId, onSelect, onElementChange }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{
    elId: string
    startX: number
    startY: number
    origX: number
    origY: number
  } | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent, el: CanvasElement) => {
    e.stopPropagation()
    onSelect(el.id)
    const canvas = canvasRef.current
    if (!canvas) return
    dragState.current = {
      elId: el.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y,
    }
  }, [onSelect])

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const drag = dragState.current
      if (!drag || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const dx = ((e.clientX - drag.startX) / rect.width) * 100
      const dy = ((e.clientY - drag.startY) / rect.height) * 100
      onElementChange(drag.elId, {
        x: Math.max(0, Math.min(95, drag.origX + dx)),
        y: Math.max(0, Math.min(95, drag.origY + dy)),
      })
    }
    function onMouseUp() {
      dragState.current = null
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [onElementChange])

  const elements = content.elements ?? []
  const bgColor = content.bg_color || '#FDF8F0'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24 }}>
      <p style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>A5 Canvas — drag elements to reposition</p>
      <div
        ref={canvasRef}
        onClick={() => onSelect(null)}
        style={{
          position: 'relative',
          width: CANVAS_W,
          height: CANVAS_H,
          background: bgColor,
          borderRadius: 4,
          boxShadow: '0 4px 30px rgba(0,0,0,0.15)',
          fontFamily: 'Georgia, serif',
          overflow: 'hidden',
          userSelect: 'none',
        }}
      >
        {elements.map(el => (
          <div
            key={el.id}
            onMouseDown={e => handleMouseDown(e, el)}
            onClick={e => { e.stopPropagation(); onSelect(el.id) }}
          >
            {renderElement(el, el.id === selectedId)}
          </div>
        ))}

        {elements.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: '#C8B89A', fontSize: 13, textAlign: 'center', padding: 32,
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Empty page</p>
            <p style={{ fontSize: 11 }}>Add elements from the left panel</p>
          </div>
        )}
      </div>
    </div>
  )
}
