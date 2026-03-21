'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Page, PageContent } from '@/types'
import ImageUploader from './ImageUploader'
import PagePreview from './PagePreview'

interface Props {
  page: Page
  pageNumber: number
  onContentChange: (content: PageContent) => void
}

export default function PageCanvas({ page, pageNumber, onContentChange }: Props) {
  const [content, setContent] = useState<PageContent>(page.content)

  // Sync when page changes
  useEffect(() => {
    setContent(page.content)
  }, [page.id])

  const update = useCallback((patch: Partial<PageContent>) => {
    const next = { ...content, ...patch }
    setContent(next)
    onContentChange(next)
  }, [content, onContentChange])

  return (
    <div className="flex h-full">
      {/* Form panel */}
      <div className="w-80 border-r border-[#333] bg-[#1a1a1a] p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="font-semibold text-[#f5f0e8]">Page {pageNumber}</h2>
          <p className="text-xs text-[#c8a96e] capitalize mt-0.5">{page.template_type.replace('_', ' ')}</p>
        </div>

        {/* Template-specific fields */}
        {(page.template_type === 'cover') && (
          <div className="space-y-4">
            <div>
              <label className="label">Cover Image</label>
              <ImageUploader
                value={content.image_url}
                onChange={url => update({ image_url: url })}
                projectId={page.project_id}
              />
            </div>
            <div>
              <label className="label">Title</label>
              <input
                className="input"
                placeholder="Journal title..."
                value={content.title_text ?? ''}
                onChange={e => update({ title_text: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Subtitle</label>
              <input
                className="input"
                placeholder="Subtitle or author name..."
                value={content.subtitle_text ?? ''}
                onChange={e => update({ subtitle_text: e.target.value })}
              />
            </div>
          </div>
        )}

        {page.template_type === 'full_image' && (
          <div>
            <label className="label">Image</label>
            <ImageUploader
              value={content.image_url}
              onChange={url => update({ image_url: url })}
              projectId={page.project_id}
            />
          </div>
        )}

        {page.template_type === 'text_image' && (
          <div className="space-y-4">
            <div>
              <label className="label">Image</label>
              <ImageUploader
                value={content.image_url}
                onChange={url => update({ image_url: url })}
                projectId={page.project_id}
              />
            </div>
            <div>
              <label className="label">Image Position</label>
              <div className="flex gap-2">
                {(['left', 'right'] as const).map(side => (
                  <button
                    key={side}
                    onClick={() => update({ image_side: side })}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors capitalize ${
                      (content.image_side ?? 'left') === side
                        ? 'border-[#c8a96e] text-[#c8a96e] bg-[#c8a96e]/10'
                        : 'border-[#333] text-[#888]'
                    }`}
                  >
                    {side}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Body Text</label>
              <textarea
                className="input min-h-[140px] resize-none"
                placeholder="Write your content here..."
                value={content.body_text ?? ''}
                onChange={e => update({ body_text: e.target.value })}
              />
            </div>
          </div>
        )}

        {page.template_type === 'prompt_lines' && (
          <div className="space-y-4">
            <div>
              <label className="label">Writing Prompt</label>
              <textarea
                className="input min-h-[100px] resize-none"
                placeholder="e.g. What are three things you're grateful for today?"
                value={content.prompt_text ?? ''}
                onChange={e => update({ prompt_text: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Number of Lines ({content.lines_count ?? 15})</label>
              <input
                type="range"
                min={5}
                max={30}
                value={content.lines_count ?? 15}
                onChange={e => update({ lines_count: parseInt(e.target.value) })}
                className="w-full accent-[#c8a96e]"
              />
              <div className="flex justify-between text-xs text-[#888] mt-1">
                <span>5</span>
                <span>30</span>
              </div>
            </div>
          </div>
        )}

        {page.template_type === 'blank' && (
          <p className="text-sm text-[#888]">Blank page — no content needed.</p>
        )}
      </div>

      {/* Live preview */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0f0f0f]">
        <div>
          <p className="text-xs text-[#555] text-center mb-3">Live Preview — A5</p>
          <PagePreview page={{ ...page, content }} />
        </div>
      </div>
    </div>
  )
}
