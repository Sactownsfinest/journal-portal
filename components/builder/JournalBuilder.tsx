'use client'

import { useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { createClient } from '@/lib/supabase/client'
import SortablePageItem from './SortablePageItem'
import PageCanvas from './PageCanvas'
import TemplateSelector from './TemplateSelector'
import type { Page, TemplateType } from '@/types'
import { Plus, ArrowLeft, Eye } from 'lucide-react'
import Link from 'next/link'

interface Props {
  projectId: string
  projectTitle: string
  initialPages: Page[]
}

export default function JournalBuilder({ projectId, projectTitle, initialPages }: Props) {
  const supabase = createClient()
  const [pages, setPages] = useState<Page[]>(initialPages)
  const [selectedPageId, setSelectedPageId] = useState<string | null>(pages[0]?.id ?? null)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [saving, setSaving] = useState(false)

  const selectedPage = pages.find(p => p.id === selectedPageId) ?? null

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  async function addPage(template: TemplateType) {
    const newOrder = pages.length
    const defaultContent = template === 'prompt_lines' ? { lines_count: 15 } : {}

    const { data, error } = await supabase
      .from('pages')
      .insert({
        project_id: projectId,
        order_index: newOrder,
        template_type: template,
        content: defaultContent,
        status: 'draft',
      })
      .select()
      .single()

    if (error || !data) return

    const newPage = data as Page
    setPages(prev => [...prev, newPage])
    setSelectedPageId(newPage.id)
    setShowTemplateSelector(false)
  }

  async function deletePage(pageId: string) {
    await supabase.from('pages').delete().eq('id', pageId)
    const remaining = pages.filter(p => p.id !== pageId)
    const reindexed = remaining.map((p, i) => ({ ...p, order_index: i }))
    setPages(reindexed)
    if (selectedPageId === pageId) setSelectedPageId(reindexed[0]?.id ?? null)
    for (const { id, order_index } of reindexed) {
      await supabase.from('pages').update({ order_index }).eq('id', id)
    }
  }

  async function updatePageContent(pageId: string, content: Page['content']) {
    setSaving(true)
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, content } : p))
    await supabase.from('pages').update({ content }).eq('id', pageId)
    setSaving(false)
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
      {/* Sidebar */}
      <aside
        className="w-56 flex flex-col"
        style={{ borderRight: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <Link
            href={`/admin/projects/${projectId}`}
            className="flex items-center gap-1.5 text-xs mb-2 transition-colors hover:text-[#D4AF37]"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={12} />
            Back to overview
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
                  onSelect={() => setSelectedPageId(page.id)}
                  onDelete={() => deletePage(page.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="p-2 space-y-1.5" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setShowTemplateSelector(true)}
            className="w-full flex items-center justify-center gap-1.5 btn-primary text-xs py-2"
            disabled={pages.length >= 150}
          >
            <Plus size={13} />
            Add Page {pages.length >= 150 && '(max 150)'}
          </button>
          <Link
            href={`/admin/projects/${projectId}`}
            className="w-full flex items-center justify-center gap-1.5 btn-secondary text-xs py-2"
          >
            <Eye size={13} />
            Preview Flipbook
          </Link>
        </div>
      </aside>

      {/* Main canvas */}
      <main className="flex-1 overflow-y-auto relative" style={{ background: 'var(--bg)' }}>
        {saving && (
          <div
            className="absolute top-4 right-4 text-xs px-3 py-1.5 rounded-full z-10"
            style={{
              color: 'var(--text-muted)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            Saving…
          </div>
        )}
        {selectedPage ? (
          <PageCanvas
            page={selectedPage}
            pageNumber={(pages.findIndex(p => p.id === selectedPage.id) + 1)}
            onContentChange={(content) => updatePageContent(selectedPage.id, content)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
            <p className="text-lg mb-4">No pages yet</p>
            <button onClick={() => setShowTemplateSelector(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              Add First Page
            </button>
          </div>
        )}
      </main>

      {showTemplateSelector && (
        <TemplateSelector
          onSelect={addPage}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  )
}
