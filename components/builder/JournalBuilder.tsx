'use client'

import { useState, useCallback, useRef } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { createClient } from '@/lib/supabase/client'
import SortablePageItem from './SortablePageItem'
import DesignerCanvas from './DesignerCanvas'
import ElementPalette from './ElementPalette'
import PropertiesPanel from './PropertiesPanel'
import ColorPicker from './ColorPicker'
import type { Page, TemplateType, CanvasElement, ElementType, PageContent } from '@/types'
import { Plus, ArrowLeft, Layers, Settings2, Palette } from 'lucide-react'
import Link from 'next/link'

interface Props {
  projectId: string
  projectTitle: string
  initialPages: Page[]
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

const DEFAULT_CONTENT: PageContent = {
  bg_color: '#FDF8F0',
  elements: [],
}

export default function JournalBuilder({ projectId, projectTitle, initialPages }: Props) {
  const supabase = createClient()
  const [pages, setPages] = useState<Page[]>(initialPages)
  const [selectedPageId, setSelectedPageId] = useState<string | null>(pages[0]?.id ?? null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [rightTab, setRightTab] = useState<'elements' | 'palette' | 'page'>('elements')

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedPage = pages.find(p => p.id === selectedPageId) ?? null
  const selectedElement = selectedPage?.content?.elements?.find(e => e.id === selectedElementId) ?? null

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function scheduleSave(pageId: string, content: PageContent) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaving(true)
    saveTimer.current = setTimeout(async () => {
      await supabase.from('pages').update({ content }).eq('id', pageId)
      setSaving(false)
    }, 600)
  }

  function updateContent(patch: Partial<PageContent>) {
    if (!selectedPage) return
    const next = { ...selectedPage.content, ...patch }
    setPages(prev => prev.map(p => p.id === selectedPage.id ? { ...p, content: next } : p))
    scheduleSave(selectedPage.id, next)
  }

  function updateElement(id: string, patch: Partial<CanvasElement>) {
    if (!selectedPage) return
    const elements = (selectedPage.content.elements ?? []).map(el =>
      el.id === id ? { ...el, ...patch } : el
    )
    updateContent({ elements })
  }

  function addElement(type: ElementType, defaults: Partial<CanvasElement>) {
    if (!selectedPage) return
    const el: CanvasElement = {
      id: generateId(),
      type,
      x: 10,
      y: 10,
      w: defaults.w ?? 80,
      h: defaults.h ?? 20,
      ...defaults,
    }
    const elements = [...(selectedPage.content.elements ?? []), el]
    updateContent({ elements })
    setSelectedElementId(el.id)
    setRightTab('palette')
  }

  function deleteElement(id: string) {
    if (!selectedPage) return
    const elements = (selectedPage.content.elements ?? []).filter(e => e.id !== id)
    updateContent({ elements })
    setSelectedElementId(null)
  }

  async function addPage() {
    const newOrder = pages.length
    const { data, error } = await supabase
      .from('pages')
      .insert({
        project_id: projectId,
        order_index: newOrder,
        template_type: 'blank' as TemplateType,
        content: DEFAULT_CONTENT,
        status: 'draft',
      })
      .select()
      .single()
    if (error || !data) return
    const newPage = data as Page
    setPages(prev => [...prev, newPage])
    setSelectedPageId(newPage.id)
    setSelectedElementId(null)
  }

  async function deletePage(pageId: string) {
    await supabase.from('pages').delete().eq('id', pageId)
    const remaining = pages.filter(p => p.id !== pageId)
    const reindexed = remaining.map((p, i) => ({ ...p, order_index: i }))
    setPages(reindexed)
    if (selectedPageId === pageId) {
      setSelectedPageId(reindexed[0]?.id ?? null)
      setSelectedElementId(null)
    }
    for (const { id, order_index } of reindexed) {
      await supabase.from('pages').update({ order_index }).eq('id', id)
    }
  }

  async function handleDragEnd(event: any) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = pages.findIndex(p => p.id === active.id)
    const newIndex = pages.findIndex(p => p.id === over.id)
    const reordered = arrayMove(pages, oldIndex, newIndex).map((p, i) => ({ ...p, order_index: i }))
    setPages(reordered)
    for (const { id, order_index } of reordered) {
      await supabase.from('pages').update({ order_index }).eq('id', id)
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden -mx-4 -my-8">

      {/* ── Left: Page List ─────────────────────────── */}
      <aside style={{
        width: 180, borderRight: '1.5px solid var(--border)',
        background: 'rgba(255,255,255,0.94)', display: 'flex', flexDirection: 'column',
      }}>
        <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <Link
            href={`/admin/projects/${projectId}`}
            className="flex items-center gap-1.5 text-xs mb-2 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <ArrowLeft size={12} /> Back
          </Link>
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{projectTitle}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{pages.length} pages</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={pages.map(p => p.id)} strategy={verticalListSortingStrategy}>
              {pages.map((page, idx) => (
                <SortablePageItem
                  key={page.id}
                  page={page}
                  index={idx}
                  isSelected={page.id === selectedPageId}
                  onSelect={() => { setSelectedPageId(page.id); setSelectedElementId(null) }}
                  onDelete={() => deletePage(page.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="p-2" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={addPage}
            disabled={pages.length >= 150}
            className="w-full flex items-center justify-center gap-1.5 btn-primary text-xs py-2"
          >
            <Plus size={13} /> Add Page
          </button>
        </div>
      </aside>

      {/* ── Center: Canvas ───────────────────────────── */}
      <main
        className="flex-1 overflow-auto relative"
        style={{ background: '#F2EDE3' }}
        onClick={() => setSelectedElementId(null)}
      >
        {saving && (
          <div className="absolute top-4 right-4 z-10 text-xs px-3 py-1.5 rounded-full"
            style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--text-muted)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            Saving…
          </div>
        )}
        {selectedPage ? (
          <DesignerCanvas
            content={selectedPage.content}
            selectedId={selectedElementId}
            onSelect={setSelectedElementId}
            onElementChange={updateElement}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
            <p className="text-lg mb-4">No pages yet</p>
            <button onClick={addPage} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Add First Page
            </button>
          </div>
        )}
      </main>

      {/* ── Right: Toolbox ───────────────────────────── */}
      <aside style={{
        width: 260, borderLeft: '1.5px solid var(--border)',
        background: 'rgba(255,255,255,0.96)', display: 'flex', flexDirection: 'column',
      }}>
        {/* Tabs */}
        <div className="flex" style={{ borderBottom: '1.5px solid var(--border)' }}>
          {[
            { id: 'elements' as const, icon: Layers, label: 'Add' },
            { id: 'palette' as const, icon: Settings2, label: 'Edit' },
            { id: 'page' as const, icon: Palette, label: 'Page' },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setRightTab(tab.id)}
                className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors"
                style={{
                  color: rightTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: rightTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                  fontWeight: rightTab === tab.id ? 600 : 400,
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto">
          {rightTab === 'elements' && (
            <ElementPalette onAdd={addElement} />
          )}

          {rightTab === 'palette' && selectedElement ? (
            <PropertiesPanel
              element={selectedElement}
              projectId={projectId}
              onChange={patch => updateElement(selectedElement.id, patch)}
              onDelete={() => deleteElement(selectedElement.id)}
            />
          ) : rightTab === 'palette' && (
            <div className="p-4 text-center pt-12" style={{ color: 'var(--text-muted)' }}>
              <Settings2 size={28} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p className="text-sm">Click an element on the canvas to edit its properties</p>
            </div>
          )}

          {rightTab === 'page' && selectedPage && (
            <div className="p-4 space-y-5">
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
                Page Background
              </p>
              <ColorPicker
                value={selectedPage.content.bg_color || '#FDF8F0'}
                onChange={v => updateContent({ bg_color: v })}
              />

              {(selectedPage.content.elements ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--accent)' }}>
                    Page Elements
                  </p>
                  <div className="space-y-1.5">
                    {(selectedPage.content.elements ?? []).map(el => (
                      <button
                        key={el.id}
                        onClick={() => { setSelectedElementId(el.id); setRightTab('palette') }}
                        className="w-full text-left text-xs px-2.5 py-2 rounded-lg transition-all"
                        style={{
                          border: '1px solid',
                          borderColor: el.id === selectedElementId ? 'var(--accent)' : 'var(--border)',
                          background: el.id === selectedElementId ? 'var(--accent-dim)' : 'transparent',
                          color: 'var(--text)',
                        }}
                      >
                        <span className="capitalize font-medium">{el.type}</span>
                        {el.text && (
                          <span style={{ color: 'var(--text-muted)' }}>
                            {' '}{el.text.slice(0, 22)}{el.text.length > 22 ? '…' : ''}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
