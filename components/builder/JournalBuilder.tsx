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
import type { Page, TemplateType, CanvasElement, ElementType, PageContent, PageTemplate, Section } from '@/types'
import { Plus, ArrowLeft, Layers, Settings2, Palette, BookMarked, Save, FolderOpen, X, Bookmark, Pencil, Trash2, Check, MousePointer } from 'lucide-react'
import Link from 'next/link'

// 8 distinct section colors
const SECTION_COLORS = [
  '#B8832A', '#7B2FBE', '#2D74A7', '#2DA87F',
  '#E85C5C', '#D97706', '#0891B2', '#8B5CF6',
]

interface Props {
  projectId: string
  projectTitle: string
  initialPages: Page[]
  initialSections: Section[]
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

const DEFAULT_CONTENT: PageContent = { bg_color: '#FDF8F0', elements: [] }

function cloneContent(content: PageContent, newName?: string): PageContent {
  return {
    ...content,
    name: newName,
    elements: (content.elements ?? []).map(el => ({ ...el, id: generateId() })),
  }
}

const LS_KEY = 'journal_page_templates'
function loadTemplates(): PageTemplate[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') } catch { return [] }
}
function saveTemplates(templates: PageTemplate[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(templates))
}

export default function JournalBuilder({ projectId, projectTitle, initialPages, initialSections }: Props) {
  const supabase = createClient()
  const [pages, setPages] = useState<Page[]>(initialPages)
  const [selectedPageId, setSelectedPageId] = useState<string | null>(pages[0]?.id ?? null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [rightTab, setRightTab] = useState<'elements' | 'palette' | 'page' | 'templates' | 'sections'>('elements')
  const [templates, setTemplates] = useState<PageTemplate[]>(() => loadTemplates())
  const [saveTemplateName, setSaveTemplateName] = useState('')
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)

  // ── Section state ────────────────────────────────
  const [sections, setSections] = useState<Section[]>(initialSections)
  const [sectionMode, setSectionMode] = useState<'create' | 'edit' | null>(null)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [sectionName, setSectionName] = useState('')
  const [rangeStart, setRangeStart] = useState<number | null>(null)
  const [rangeEnd, setRangeEnd] = useState<number | null>(null)
  const [sectionSaving, setSectionSaving] = useState(false)
  const [sectionError, setSectionError] = useState('')

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selectedPage = pages.find(p => p.id === selectedPageId) ?? null
  const selectedElement = selectedPage?.content?.elements?.find(e => e.id === selectedElementId) ?? null
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // ── Section helpers ───────────────────────────────
  const sectionColorMap: Record<string, string> = {}
  sections.forEach((s, i) => { sectionColorMap[s.id] = SECTION_COLORS[i % SECTION_COLORS.length] })

  function getPageSection(pageNum: number): Section | null {
    return sections.find(s => pageNum >= s.page_start && pageNum <= s.page_end) ?? null
  }

  const rangeSelStart = rangeStart !== null && rangeEnd !== null ? Math.min(rangeStart, rangeEnd) : rangeStart
  const rangeSelEnd   = rangeStart !== null && rangeEnd !== null ? Math.max(rangeStart, rangeEnd) : null
  const rangeCount    = rangeSelStart && rangeSelEnd ? rangeSelEnd - rangeSelStart + 1 : rangeSelStart ? 1 : 0

  function handleRangeClick(pageNum: number) {
    if (rangeStart === null) {
      setRangeStart(pageNum)
      setRangeEnd(null)
    } else if (rangeEnd === null) {
      if (pageNum === rangeStart) {
        setRangeStart(null)
      } else {
        setRangeStart(Math.min(pageNum, rangeStart))
        setRangeEnd(Math.max(pageNum, rangeStart))
      }
    } else {
      // Reset and start new selection
      setRangeStart(pageNum)
      setRangeEnd(null)
    }
  }

  function openCreateSection() {
    setSectionMode('create')
    setEditingSectionId(null)
    setSectionName('')
    setRangeStart(null)
    setRangeEnd(null)
    setSectionError('')
  }

  function openEditSection(section: Section) {
    setSectionMode('edit')
    setEditingSectionId(section.id)
    setSectionName(section.name)
    setRangeStart(section.page_start)
    setRangeEnd(section.page_end)
    setSectionError('')
  }

  function cancelSectionMode() {
    setSectionMode(null)
    setEditingSectionId(null)
    setSectionName('')
    setRangeStart(null)
    setRangeEnd(null)
    setSectionError('')
  }

  async function saveSection() {
    const start = rangeSelStart
    const end   = rangeSelEnd ?? rangeSelStart

    if (!sectionName.trim()) { setSectionError('Section name is required'); return }
    if (!start || !end) { setSectionError('Select a page range in the sidebar'); return }

    // Overlap check (excluding self when editing)
    const overlap = sections.find(s => {
      if (sectionMode === 'edit' && s.id === editingSectionId) return false
      return !(end < s.page_start || start > s.page_end)
    })
    if (overlap) {
      setSectionError(`Overlaps with "${overlap.name}" (pages ${overlap.page_start}–${overlap.page_end})`)
      return
    }

    setSectionSaving(true)
    setSectionError('')

    if (sectionMode === 'create') {
      const { data, error } = await supabase
        .from('sections')
        .insert({ project_id: projectId, name: sectionName.trim(), page_start: start, page_end: end, status: 'draft' })
        .select().single()
      if (error) { setSectionError(error.message); setSectionSaving(false); return }
      setSections(prev => [...prev, data as Section].sort((a, b) => a.page_start - b.page_start))
    } else {
      const { error } = await supabase
        .from('sections')
        .update({ name: sectionName.trim(), page_start: start, page_end: end })
        .eq('id', editingSectionId!)
      if (error) { setSectionError(error.message); setSectionSaving(false); return }
      setSections(prev => prev.map(s =>
        s.id === editingSectionId ? { ...s, name: sectionName.trim(), page_start: start, page_end: end } : s
      ).sort((a, b) => a.page_start - b.page_start))
    }

    setSectionSaving(false)
    cancelSectionMode()
  }

  async function deleteSection(id: string) {
    await supabase.from('sections').delete().eq('id', id)
    setSections(prev => prev.filter(s => s.id !== id))
  }

  // ── Page save / content helpers ───────────────────
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

  function renamePage(pageId: string, name: string) {
    const page = pages.find(p => p.id === pageId)
    if (!page) return
    const next = { ...page.content, name }
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, content: next } : p))
    scheduleSave(pageId, next)
  }

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
    const updated = [...pages]
    updated.splice(idx + 1, 0, newPage)
    const reindexed = updated.map((p, i) => ({ ...p, order_index: i }))
    setPages(reindexed)
    setSelectedPageId(newPage.id)
    for (const { id, order_index } of reindexed) {
      await supabase.from('pages').update({ order_index }).eq('id', id)
    }
  }

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
    const updated = [...pages]
    updated.splice(insertAfterIdx + 1, 0, ...newPages)
    const reindexed = updated.map((p, i) => ({ ...p, order_index: i }))
    setPages(reindexed)
    if (newPages[0]) setSelectedPageId(newPages[0].id)
    for (const { id, order_index } of reindexed) {
      await supabase.from('pages').update({ order_index }).eq('id', id)
    }
  }

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

  const inRangeMode = sectionMode !== null

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

          {/* Range selection mode banner */}
          {inRangeMode ? (
            <div className="mt-1.5 rounded-lg px-2 py-1.5 flex items-center gap-1.5"
              style={{ background: 'rgba(184,131,42,0.1)', border: '1px solid rgba(184,131,42,0.3)' }}>
              <MousePointer size={10} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <p className="text-[10px] font-semibold leading-tight" style={{ color: 'var(--accent)' }}>
                {rangeStart === null
                  ? 'Click first page'
                  : rangeEnd === null
                  ? 'Click last page'
                  : `Pages ${rangeSelStart}–${rangeSelEnd}`}
              </p>
            </div>
          ) : (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{pages.length} pages · dbl-click to rename</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <DndContext
            sensors={inRangeMode ? [] : sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={pages.map(p => p.id)} strategy={verticalListSortingStrategy}>
              {pages.map((page, idx) => {
                const pageNum = idx + 1
                const pageSection = getPageSection(pageNum)
                const isInPending = rangeSelStart !== null
                  ? rangeSelEnd !== null
                    ? pageNum >= rangeSelStart && pageNum <= rangeSelEnd
                    : pageNum === rangeSelStart
                  : false
                const isEndpoint = pageNum === rangeSelStart || (rangeSelEnd !== null && pageNum === rangeSelEnd)

                return (
                  <SortablePageItem
                    key={page.id}
                    page={page}
                    index={idx}
                    isSelected={page.id === selectedPageId}
                    sectionColor={pageSection ? sectionColorMap[pageSection.id] : null}
                    sectionName={pageSection?.name ?? null}
                    rangeMode={inRangeMode}
                    inPendingRange={inRangeMode && isInPending}
                    isPendingEndpoint={inRangeMode && isEndpoint}
                    onRangeClick={() => handleRangeClick(pageNum)}
                    onSelect={() => { if (!inRangeMode) { setSelectedPageId(page.id); setSelectedElementId(null) } }}
                    onDelete={() => deletePage(page.id)}
                    onDuplicate={() => duplicatePage(page.id)}
                    onDuplicateAsSection={() => duplicateAsSection(page.id)}
                    onRename={name => renamePage(page.id, name)}
                  />
                )
              })}
            </SortableContext>
          </DndContext>
        </div>

        <div className="p-2" style={{ borderTop: '1px solid var(--border)' }}>
          {inRangeMode ? (
            <button onClick={cancelSectionMode} className="w-full flex items-center justify-center gap-1.5 btn-secondary text-xs py-2">
              <X size={13} /> Cancel Selection
            </button>
          ) : (
            <button onClick={addPage} disabled={pages.length >= 150} className="w-full flex items-center justify-center gap-1.5 btn-primary text-xs py-2">
              <Plus size={13} /> Add Page
            </button>
          )}
        </div>
      </aside>

      {/* ── Center: Canvas ───────────────────────────── */}
      <main
        className="flex-1 overflow-auto relative"
        style={{ background: '#F2EDE3' }}
        onClick={() => { if (!inRangeMode) setSelectedElementId(null) }}
      >
        {saving && (
          <div className="absolute top-4 right-4 z-10 text-xs px-3 py-1.5 rounded-full"
            style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--text-muted)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            Saving…
          </div>
        )}
        {selectedPage && !inRangeMode ? (
          <DesignerCanvas
            content={selectedPage.content}
            selectedId={selectedElementId}
            onSelect={setSelectedElementId}
            onElementChange={updateElement}
          />
        ) : inRangeMode ? (
          <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color: 'var(--text-muted)' }}>
            <div className="text-center">
              <MousePointer size={36} style={{ margin: '0 auto 12px', opacity: 0.25 }} />
              <p className="text-base font-semibold" style={{ color: 'var(--accent)' }}>Select pages in the sidebar</p>
              <p className="text-sm mt-1">
                {rangeStart === null
                  ? 'Click the first page of your section'
                  : rangeEnd === null
                  ? 'Now click the last page of your section'
                  : `Pages ${rangeSelStart}–${rangeSelEnd} selected (${rangeCount} pages)`}
              </p>
            </div>
          </div>
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
            { id: 'elements' as const, icon: Layers,    label: 'Add' },
            { id: 'palette'  as const, icon: Settings2, label: 'Edit' },
            { id: 'page'     as const, icon: Palette,   label: 'Page' },
            { id: 'sections' as const, icon: Bookmark,  label: 'Sections' },
            { id: 'templates'as const, icon: BookMarked,label: 'Templates' },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id}
                onClick={() => { setRightTab(tab.id); if (tab.id !== 'sections') cancelSectionMode() }}
                className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors"
                style={{
                  color: rightTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: rightTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                  fontWeight: rightTab === tab.id ? 600 : 400,
                }}
              >
                <Icon size={13} />{tab.label}
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

          {/* ── Sections Tab ─────────────────────────── */}
          {rightTab === 'sections' && (
            <div className="p-4 space-y-4">

              {/* Create / Edit form */}
              {sectionMode ? (
                <div className="rounded-xl p-3 space-y-3"
                  style={{ background: 'var(--accent-dim)', border: '1px solid rgba(184,131,42,0.25)' }}>
                  <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
                    {sectionMode === 'create' ? 'New Section' : 'Edit Section'}
                  </p>

                  <div>
                    <label className="label">Section Name</label>
                    <input
                      className="input text-sm"
                      placeholder="e.g. Introduction, Chapter 1…"
                      value={sectionName}
                      onChange={e => setSectionName(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {/* Range status */}
                  <div className="rounded-lg px-3 py-2.5"
                    style={{ background: 'white', border: '1px solid rgba(184,131,42,0.2)' }}>
                    {rangeCount === 0 ? (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        👈 Click pages in the sidebar to select a range
                      </p>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                          Pages {rangeSelStart}{rangeSelEnd && rangeSelEnd !== rangeSelStart ? `–${rangeSelEnd}` : ''} &nbsp;·&nbsp; {rangeCount} page{rangeCount !== 1 ? 's' : ''}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          Click another page to adjust
                        </p>
                      </div>
                    )}
                  </div>

                  {sectionError && (
                    <p className="text-xs" style={{ color: 'var(--danger)' }}>{sectionError}</p>
                  )}

                  <div className="flex gap-2">
                    <button onClick={cancelSectionMode} className="btn-secondary flex-1 text-xs py-1.5">
                      Cancel
                    </button>
                    <button
                      onClick={saveSection}
                      disabled={sectionSaving || !sectionName.trim() || rangeCount === 0}
                      className="btn-primary flex-1 text-xs py-1.5 flex items-center justify-center gap-1"
                    >
                      <Check size={12} />
                      {sectionSaving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={openCreateSection}
                  className="w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl transition-all"
                  style={{ border: '1.5px dashed rgba(184,131,42,0.4)', color: 'var(--accent)', background: 'var(--accent-dim)' }}
                >
                  <Plus size={13} /> New Section
                </button>
              )}

              {/* Section list */}
              {sections.length === 0 && !sectionMode ? (
                <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  <Bookmark size={24} style={{ margin: '0 auto 8px', opacity: 0.25 }} />
                  <p className="text-xs">No sections yet.<br />Click "New Section" and select pages in the sidebar.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sections.map((section, i) => {
                    const color = SECTION_COLORS[i % SECTION_COLORS.length]
                    const isEditing = sectionMode === 'edit' && editingSectionId === section.id
                    return (
                      <div
                        key={section.id}
                        className="rounded-xl overflow-hidden"
                        style={{
                          border: `1.5px solid ${isEditing ? color : 'var(--border)'}`,
                          background: isEditing ? `${color}10` : 'var(--surface)',
                        }}
                      >
                        <div className="px-3 py-2.5 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{section.name}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              Pages {section.page_start}–{section.page_end} · {section.page_end - section.page_start + 1} pages
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openEditSection(section)}
                              disabled={sectionMode !== null}
                              className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                              style={{ color: 'var(--text-muted)' }}
                              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                              title="Edit section"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              onClick={() => deleteSection(section.id)}
                              disabled={sectionMode !== null}
                              className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                              style={{ color: 'var(--text-muted)' }}
                              onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                              title="Delete section"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                        {/* Status badge */}
                        <div className="px-3 pb-2">
                          <span className="text-[10px] font-medium capitalize px-1.5 py-0.5 rounded-full"
                            style={{
                              background: section.status === 'approved' ? 'rgba(45,212,191,0.1)' : section.status === 'rejected' ? 'rgba(248,113,113,0.1)' : 'rgba(42,74,107,0.15)',
                              color: section.status === 'approved' ? 'var(--success)' : section.status === 'rejected' ? 'var(--danger)' : 'var(--text-muted)',
                            }}>
                            {section.status}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Templates */}
          {rightTab === 'templates' && (
            <div className="p-4 space-y-4">
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>Page Templates</p>
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
                        placeholder="Template name"
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
