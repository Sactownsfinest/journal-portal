'use client'

import { useState, useRef } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { createClient } from '@/lib/supabase/client'
import SortablePageItem from './SortablePageItem'
import DesignerCanvas from './DesignerCanvas'
import ElementPalette from './ElementPalette'
import PropertiesPanel from './PropertiesPanel'
import ColorPicker from './ColorPicker'
import type { Page, TemplateType, CanvasElement, ElementType, PageContent, PageTemplate } from '@/types'
import { Plus, ArrowLeft, Layers, Settings2, Palette, BookMarked, Save, FolderOpen, X } from 'lucide-react'
import Link from 'next/link'

interface Props {
  projectId: string
  projectTitle: string
  initialPages: Page[]
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

const DEFAULT_CONTENT: PageContent = { bg_color: '#FDF8F0', elements: [] }

// Deep-clone content with fresh element IDs (for duplication)
function cloneContent(content: PageContent, newName?: string): PageContent {
  return {
    ...content,
    name: newName,
    elements: (content.elements ?? []).map(el => ({ ...el, id: generateId() })),
  }
}

// LocalStorage template helpers
const LS_KEY = 'journal_page_templates'
function loadTemplates(): PageTemplate[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') } catch { return [] }
}
function saveTemplates(templates: PageTemplate[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(templates))
}

export default function JournalBuilder({ projectId, projectTitle, initialPages }: Props) {
  const supabase = createClient()
  const [pages, setPages] = useState<Page[]>(initialPages)
  const [selectedPageId, setSelectedPageId] = useState<string | null>(pages[0]?.id ?? null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [rightTab, setRightTab] = useState<'elements' | 'palette' | 'page' | 'templates'>('elements')
  const [templates, setTemplates] = useState<PageTemplate[]>(() => loadTemplates())
  const [saveTemplateName, setSaveTemplateName] = useState('')
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)

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
    const el: CanvasElement = { id: generateId(), type, x: 10, y: 10, w: defaults.w ?? 80, h: defaults.h ?? 20, ...defaults }
    updateContent({ elements: [...(selectedPage.content.elements ?? []), el] })
    setSelectedElementId(el.id)
    setRightTab('palette')
  }

  function deleteElement(id: string) {
    if (!selectedPage) return
    updateContent({ elements: (selectedPage.content.elements ?? []).filter(e => e.id !== id) })
    setSelectedElementId(null)
  }

  // ── Page rename ─────────────────────────────────
  function renamePage(pageId: string, name: string) {
    const page = pages.find(p => p.id === pageId)
    if (!page) return
    const next = { ...page.content, name }
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, content: next } : p))
    scheduleSave(pageId, next)
  }

  // ── Add blank page ───────────────────────────────
  async function addPage() {
    const newOrder = pages.length
    const { data, error } = await supabase
      .from('pages')
      .insert({ project_id: projectId, order_index: newOrder, template_type: 'blank' as TemplateType, content: DEFAULT_CONTENT, status: 'draft' })
      .select().single()
    if (error || !data) return
    const newPage = data as Page
    setPages(prev => [...prev, newPage])
    setSelectedPageId(newPage.id)
    setSelectedElementId(null)
  }

  // ── Duplicate single page ─────────────────────────
  async function duplicatePage(pageId: string) {
    const page = pages.find(p => p.id === pageId)
    if (!page) return
    const idx = pages.findIndex(p => p.id === pageId)
    const cloned = cloneContent(page.content, page.content.name ? `${page.content.name} (copy)` : undefined)
    const { data, error } = await supabase
      .from('pages')
      .insert({ project_id: projectId, order_index: idx + 1, template_type: page.template_type, content: cloned, status: 'draft' })
      .select().single()
    if (error || !data) return
    const newPage = data as Page
    // Insert after current + reindex
    const updated = [...pages]
    updated.splice(idx + 1, 0, newPage)
    const reindexed = updated.map((p, i) => ({ ...p, order_index: i }))
    setPages(reindexed)
    setSelectedPageId(newPage.id)
    for (const { id, order_index } of reindexed) {
      await supabase.from('pages').update({ order_index }).eq('id', id)
    }
  }

  // ── Duplicate as 4-page section ───────────────────
  async function duplicateAsSection(pageId: string) {
    const page = pages.find(p => p.id === pageId)
    if (!page) return
    const insertAfterIdx = pages.findIndex(p => p.id === pageId)

    const newPages: Page[] = []
    for (let i = 0; i < 4; i++) {
      const cloned = cloneContent(page.content, `Section Page ${i + 1}`)
      const { data, error } = await supabase
        .from('pages')
        .insert({ project_id: projectId, order_index: insertAfterIdx + 1 + i, template_type: page.template_type, content: cloned, status: 'draft' })
        .select().single()
      if (!error && data) newPages.push(data as Page)
    }

    // Splice all 4 after the source page
    const updated = [...pages]
    updated.splice(insertAfterIdx + 1, 0, ...newPages)
    const reindexed = updated.map((p, i) => ({ ...p, order_index: i }))
    setPages(reindexed)
    if (newPages[0]) setSelectedPageId(newPages[0].id)
    for (const { id, order_index } of reindexed) {
      await supabase.from('pages').update({ order_index }).eq('id', id)
    }
  }

  // ── Delete page ──────────────────────────────────
  async function deletePage(pageId: string) {
    await supabase.from('pages').delete().eq('id', pageId)
    const remaining = pages.filter(p => p.id !== pageId)
    const reindexed = remaining.map((p, i) => ({ ...p, order_index: i }))
    setPages(reindexed)
    if (selectedPageId === pageId) { setSelectedPageId(reindexed[0]?.id ?? null); setSelectedElementId(null) }
    for (const { id, order_index } of reindexed) {
      await supabase.from('pages').update({ order_index }).eq('id', id)
    }
  }

  // ── Drag reorder ─────────────────────────────────
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

  // ── Templates ────────────────────────────────────
  function saveTemplate() {
    if (!selectedPage || !saveTemplateName.trim()) return
    const t: PageTemplate = {
      id: generateId(),
      name: saveTemplateName.trim(),
      bg_color: selectedPage.content.bg_color,
      elements: (selectedPage.content.elements ?? []).map(el => ({ ...el })),
      created_at: new Date().toISOString(),
    }
    const updated = [...templates, t]
    setTemplates(updated)
    saveTemplates(updated)
    setSaveTemplateName('')
    setShowSaveTemplate(false)
  }

  function applyTemplate(template: PageTemplate) {
    if (!selectedPage) return
    const content: PageContent = {
      ...selectedPage.content,
      bg_color: template.bg_color,
      elements: template.elements.map(el => ({ ...el, id: generateId() })),
    }
    updateContent(content)
    setSelectedElementId(null)
  }

  function deleteTemplate(id: string) {
    const updated = templates.filter(t => t.id !== id)
    setTemplates(updated)
    saveTemplates(updated)
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden -mx-4 -my-8">

      {/* ── Left: Page List ─────────────────────────── */}
      <aside style={{ width: 185, borderRight: '1.5px solid var(--border)', background: 'rgba(255,255,255,0.94)', display: 'flex', flexDirection: 'column' }}>
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
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{pages.length} pages · double-click to rename</p>
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
                  onDuplicate={() => duplicatePage(page.id)}
                  onDuplicateAsSection={() => duplicateAsSection(page.id)}
                  onRename={name => renamePage(page.id, name)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="p-2" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={addPage} disabled={pages.length >= 150} className="w-full flex items-center justify-center gap-1.5 btn-primary text-xs py-2">
            <Plus size={13} /> Add Page
          </button>
        </div>
      </aside>

      {/* ── Center: Canvas ───────────────────────────── */}
      <main className="flex-1 overflow-auto relative" style={{ background: '#F2EDE3' }} onClick={() => setSelectedElementId(null)}>
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
            <button onClick={addPage} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add First Page</button>
          </div>
        )}
      </main>

      {/* ── Right: Toolbox ───────────────────────────── */}
      <aside style={{ width: 268, borderLeft: '1.5px solid var(--border)', background: 'rgba(255,255,255,0.96)', display: 'flex', flexDirection: 'column' }}>
        {/* Tabs */}
        <div className="flex" style={{ borderBottom: '1.5px solid var(--border)' }}>
          {[
            { id: 'elements' as const, icon: Layers, label: 'Add' },
            { id: 'palette' as const, icon: Settings2, label: 'Edit' },
            { id: 'page' as const, icon: Palette, label: 'Page' },
            { id: 'templates' as const, icon: BookMarked, label: 'Templates' },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setRightTab(tab.id)}
                className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors"
                style={{
                  color: rightTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: rightTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                  fontWeight: rightTab === tab.id ? 600 : 400,
                }}
              >
                <Icon size={14} />{tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Add Elements */}
          {rightTab === 'elements' && <ElementPalette onAdd={addElement} />}

          {/* Edit Element */}
          {rightTab === 'palette' && selectedElement ? (
            <PropertiesPanel element={selectedElement} projectId={projectId}
              onChange={patch => updateElement(selectedElement.id, patch)}
              onDelete={() => deleteElement(selectedElement.id)}
            />
          ) : rightTab === 'palette' && (
            <div className="p-4 text-center pt-12" style={{ color: 'var(--text-muted)' }}>
              <Settings2 size={28} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p className="text-sm">Click an element on the canvas to edit its properties</p>
            </div>
          )}

          {/* Page Settings */}
          {rightTab === 'page' && selectedPage && (
            <div className="p-4 space-y-5">
              <div>
                <label className="label">Page Name</label>
                <input
                  className="input text-sm"
                  placeholder={`Page ${(pages.findIndex(p => p.id === selectedPage.id) + 1)}`}
                  value={selectedPage.content.name ?? ''}
                  onChange={e => updateContent({ name: e.target.value })}
                />
              </div>
              <ColorPicker
                label="Page Background"
                value={selectedPage.content.bg_color || '#FDF8F0'}
                onChange={v => updateContent({ bg_color: v })}
              />
              {(selectedPage.content.elements ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--accent)' }}>Elements</p>
                  <div className="space-y-1.5">
                    {(selectedPage.content.elements ?? []).map(el => (
                      <button key={el.id} onClick={() => { setSelectedElementId(el.id); setRightTab('palette') }}
                        className="w-full text-left text-xs px-2.5 py-2 rounded-lg transition-all"
                        style={{ border: '1px solid', borderColor: el.id === selectedElementId ? 'var(--accent)' : 'var(--border)', background: el.id === selectedElementId ? 'var(--accent-dim)' : 'transparent', color: 'var(--text)' }}
                      >
                        <span className="capitalize font-medium">{el.type}</span>
                        {el.text && <span style={{ color: 'var(--text-muted)' }}> {el.text.slice(0, 20)}{el.text.length > 20 ? '…' : ''}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Templates */}
          {rightTab === 'templates' && (
            <div className="p-4 space-y-4">
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>Page Templates</p>

              {/* Save current page as template */}
              {selectedPage && (
                <div>
                  {!showSaveTemplate ? (
                    <button onClick={() => setShowSaveTemplate(true)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl transition-all"
                      style={{ border: '1.5px dashed rgba(184,131,42,0.4)', color: 'var(--accent)', background: 'var(--accent-dim)' }}
                    >
                      <Save size={13} /> Save Current Page as Template
                    </button>
                  ) : (
                    <div className="space-y-2 p-3 rounded-xl" style={{ background: 'var(--accent-dim)', border: '1px solid rgba(184,131,42,0.2)' }}>
                      <input
                        className="input text-sm"
                        placeholder="Template name (e.g. Section Layout A)"
                        value={saveTemplateName}
                        onChange={e => setSaveTemplateName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveTemplate()}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button onClick={() => setShowSaveTemplate(false)} className="btn-secondary flex-1 text-xs py-1.5">Cancel</button>
                        <button onClick={saveTemplate} disabled={!saveTemplateName.trim()} className="btn-primary flex-1 text-xs py-1.5">Save</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Template list */}
              {templates.length === 0 ? (
                <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
                  <FolderOpen size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                  <p className="text-xs">No templates saved yet.<br />Design a page and save it as a template.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map(t => (
                    <div key={t.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                      <div className="px-3 py-2 flex items-center justify-between" style={{ background: 'rgba(44,36,22,0.02)' }}>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{t.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.elements.length} elements</p>
                        </div>
                        <button onClick={() => deleteTemplate(t.id)} style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                        ><X size={13} /></button>
                      </div>
                      <button
                        onClick={() => applyTemplate(t)}
                        disabled={!selectedPage}
                        className="w-full text-xs py-2 font-semibold transition-all"
                        style={{ color: 'var(--accent)', background: 'var(--accent-dim)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(184,131,42,0.15)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent-dim)')}
                      >
                        Apply to Current Page
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
