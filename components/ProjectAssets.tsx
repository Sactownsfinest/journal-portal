'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, BookOpen, Scroll, Trash2, Download, Plus, X } from 'lucide-react'

interface Asset {
  id: string
  project_id: string
  uploaded_by: string
  category: 'prompts' | 'story' | 'scriptures' | 'design'
  file_name: string
  file_url: string
  file_size: number | null
  mime_type: string | null
  notes: string | null
  created_at: string
  profiles?: { name: string }
}

interface Props {
  projectId: string
  initialAssets?: Asset[]
}

const CATEGORIES = [
  {
    key: 'prompts' as const,
    label: 'Journal Prompts',
    description: 'Writing prompts, questions, or topics for journal pages',
    icon: BookOpen,
    color: 'var(--accent)',
    bg: 'var(--accent-dim)',
    border: 'rgba(184,131,42,0.25)',
  },
  {
    key: 'story' as const,
    label: 'Your Story',
    description: 'Personal narrative, biography, or life story content',
    icon: FileText,
    color: 'var(--violet)',
    bg: 'var(--violet-dim)',
    border: 'rgba(139,107,174,0.25)',
  },
  {
    key: 'scriptures' as const,
    label: 'Scriptures & Quotes',
    description: 'Favorite verses, quotes, or inspirational passages',
    icon: Scroll,
    color: 'var(--success)',
    bg: 'rgba(74,158,127,0.1)',
    border: 'rgba(74,158,127,0.25)',
  },
]

function formatBytes(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ProjectAssets({ projectId, initialAssets = [] }: Props) {
  const supabase = createClient()
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [uploading, setUploading] = useState<string | null>(null) // category key
  const [error, setError] = useState('')
  const [noteModal, setNoteModal] = useState<{ category: string; note: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeCategory = useRef<string>('')

  async function fetchAssets() {
    const { data } = await supabase
      .from('project_assets')
      .select('*, profiles(name)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (data) setAssets(data as Asset[])
  }

  function openUpload(category: string) {
    activeCategory.current = category
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const category = activeCategory.current
    if (!category) return

    if (file.size > 50 * 1024 * 1024) {
      setError('File must be under 50MB')
      return
    }

    setError('')
    setUploading(category)

    const ext = file.name.split('.').pop()
    const path = `${projectId}/${category}/${Date.now()}-${file.name}`

    const { error: uploadErr } = await supabase.storage
      .from('project-assets')
      .upload(path, file, { upsert: false })

    if (uploadErr) {
      setError(uploadErr.message)
      setUploading(null)
      return
    }

    const { data: urlData } = supabase.storage.from('project-assets').getPublicUrl(path)

    const { data: asset, error: dbErr } = await supabase
      .from('project_assets')
      .insert({
        project_id: projectId,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        category,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
      })
      .select('*, profiles(name)')
      .single()

    if (dbErr) {
      setError(dbErr.message)
    } else if (asset) {
      setAssets(prev => [asset as Asset, ...prev])
    }

    setUploading(null)
  }

  async function deleteAsset(asset: Asset) {
    // Extract storage path from URL
    const url = new URL(asset.file_url)
    const pathParts = url.pathname.split('/project-assets/')
    const storagePath = pathParts[1]

    if (storagePath) {
      await supabase.storage.from('project-assets').remove([storagePath])
    }
    await supabase.from('project_assets').delete().eq('id', asset.id)
    setAssets(prev => prev.filter(a => a.id !== asset.id))
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1.5px solid var(--border)', background: 'var(--card)' }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center gap-3"
        style={{
          borderBottom: '1.5px solid var(--border)',
          background: 'linear-gradient(135deg, #FFFBF2, #FFF8ED)',
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--accent-dim)', border: '1px solid rgba(184,131,42,0.2)' }}
        >
          <Upload size={16} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h2 className="font-bold" style={{ color: 'var(--accent)' }}>Project Assets</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Shared files — both you and your designer can see and download these
          </p>
        </div>
      </div>

      {/* Category sections */}
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {CATEGORIES.map(cat => {
          const catAssets = assets.filter(a => a.category === cat.key)
          const Icon = cat.icon

          return (
            <div key={cat.key} className="p-5">
              {/* Category header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: cat.bg, border: `1px solid ${cat.border}` }}
                  >
                    <Icon size={15} style={{ color: cat.color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{cat.label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{cat.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => openUpload(cat.key)}
                  disabled={uploading === cat.key}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: cat.bg,
                    border: `1px solid ${cat.border}`,
                    color: cat.color,
                    opacity: uploading === cat.key ? 0.6 : 1,
                  }}
                >
                  {uploading === cat.key ? (
                    <>
                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Plus size={13} />
                      Upload File
                    </>
                  )}
                </button>
              </div>

              {/* Files list */}
              {catAssets.length === 0 ? (
                <div
                  className="rounded-xl px-4 py-5 text-center text-xs"
                  style={{
                    background: 'rgba(44,36,22,0.02)',
                    border: '1.5px dashed var(--border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  No files uploaded yet — click Upload File to get started
                </div>
              ) : (
                <div className="space-y-2">
                  {catAssets.map(asset => (
                    <div
                      key={asset.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{ background: 'rgba(44,36,22,0.03)', border: '1px solid var(--border)' }}
                    >
                      <FileText size={15} style={{ color: cat.color, flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                          {asset.file_name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {formatBytes(asset.file_size)}
                          {asset.profiles?.name && ` · Uploaded by ${asset.profiles.name}`}
                          {' · '}{new Date(asset.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={asset.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = cat.color)}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                          title="Download"
                        >
                          <Download size={14} />
                        </a>
                        <button
                          onClick={() => deleteAsset(asset)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 mb-5 flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl"
          style={{ color: 'var(--danger)', background: 'rgba(192,82,74,0.08)', border: '1px solid rgba(192,82,74,0.2)' }}
        >
          <X size={13} />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={12} /></button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
        onChange={handleFileChange}
      />
    </div>
  )
}
