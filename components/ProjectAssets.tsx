'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Upload, FileText, BookOpen, Scroll, Trash2, Download,
  Plus, X, ChevronDown, Image as ImageIcon, Eye,
} from 'lucide-react'

type AssetCategory = 'prompts' | 'story' | 'scriptures' | 'images' | 'design'

interface Asset {
  id: string
  project_id: string
  uploaded_by: string
  category: AssetCategory
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
  /** When false, delete button is hidden (use on client portal) */
  canDelete?: boolean
}

const CATEGORIES: {
  key: AssetCategory
  label: string
  description: string
  icon: React.ElementType
  color: string
  bg: string
  border: string
  accept: string
}[] = [
  {
    key: 'images',
    label: 'Images & Photos',
    description: 'Photos, graphics, or inspiration images for your journal',
    icon: ImageIcon,
    color: '#5B8DB8',
    bg: 'rgba(91,141,184,0.10)',
    border: 'rgba(91,141,184,0.25)',
    accept: '.jpg,.jpeg,.png,.webp,.gif,.heic',
  },
  {
    key: 'prompts',
    label: 'Journal Prompts',
    description: 'Writing prompts, questions, or topics for journal pages',
    icon: BookOpen,
    color: 'var(--accent)',
    bg: 'var(--accent-dim)',
    border: 'rgba(184,131,42,0.25)',
    accept: '.pdf,.doc,.docx,.txt',
  },
  {
    key: 'story',
    label: 'Your Story',
    description: 'Personal narrative, biography, or life story content',
    icon: FileText,
    color: 'var(--violet)',
    bg: 'var(--violet-dim)',
    border: 'rgba(139,107,174,0.25)',
    accept: '.pdf,.doc,.docx,.txt',
  },
  {
    key: 'scriptures',
    label: 'Scriptures & Quotes',
    description: 'Favorite verses, quotes, or inspirational passages',
    icon: Scroll,
    color: 'var(--success)',
    bg: 'rgba(74,158,127,0.10)',
    border: 'rgba(74,158,127,0.25)',
    accept: '.pdf,.doc,.docx,.txt',
  },
]

function formatBytes(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(asset: Asset) {
  return !!(asset.mime_type?.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|gif|heic)$/i.test(asset.file_name))
}

// Floating image/file preview shown on hover
function HoverPreview({ asset, cat }: { asset: Asset; cat: typeof CATEGORIES[0] }) {
  if (isImage(asset)) {
    return (
      <div
        className="pointer-events-none absolute z-50 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          bottom: 'calc(100% + 10px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 220,
          background: 'var(--card)',
          border: '1.5px solid var(--border)',
        }}
      >
        <img
          src={asset.file_url}
          alt={asset.file_name}
          style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
        />
        <div className="px-3 py-2">
          <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{asset.file_name}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatBytes(asset.file_size)}</p>
        </div>
      </div>
    )
  }
  return (
    <div
      className="pointer-events-none absolute z-50 rounded-xl shadow-2xl px-4 py-3"
      style={{
        bottom: 'calc(100% + 10px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 200,
        background: 'var(--card)',
        border: '1.5px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
          <cat.icon size={14} style={{ color: cat.color }} />
        </div>
        <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text)' }}>{asset.file_name}</p>
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatBytes(asset.file_size)}</p>
      <p className="text-xs mt-1 font-medium" style={{ color: cat.color }}>Click download to open ↓</p>
    </div>
  )
}

// A single file row with hover preview
function AssetRow({
  asset, cat, canDelete, onDelete,
}: {
  asset: Asset
  cat: typeof CATEGORIES[0]
  canDelete: boolean
  onDelete: (a: Asset) => void
}) {
  const [hovered, setHovered] = useState(false)
  const img = isImage(asset)

  return (
    <div
      className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all group"
      style={{
        background: hovered ? cat.bg : 'rgba(44,36,22,0.025)',
        border: `1px solid ${hovered ? cat.border : 'var(--border)'}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hover preview popup */}
      {hovered && <HoverPreview asset={asset} cat={cat} />}

      {/* Thumbnail (images) or icon */}
      {img ? (
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ border: `1px solid ${cat.border}` }}>
          <img src={asset.file_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
          <FileText size={16} style={{ color: cat.color }} />
        </div>
      )}

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{asset.file_name}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {formatBytes(asset.file_size)}
          {asset.profiles?.name && ` · ${asset.profiles.name}`}
          {' · '}{new Date(asset.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={asset.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-muted)', background: 'var(--surface)' }}
          onMouseEnter={e => (e.currentTarget.style.color = cat.color)}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          title="Download / Open"
        >
          <Download size={14} />
        </a>
        {canDelete && (
          <button
            onClick={() => onDelete(asset)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-muted)', background: 'var(--surface)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

// A collapsible category card
function CategoryCard({
  cat, assets, uploading, canDelete, onUpload, onDelete,
}: {
  cat: typeof CATEGORIES[0]
  assets: Asset[]
  uploading: boolean
  canDelete: boolean
  onUpload: () => void
  onDelete: (a: Asset) => void
}) {
  const [open, setOpen] = useState(assets.length > 0)
  const Icon = cat.icon
  const hasImages = cat.key === 'images'

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{ border: `1.5px solid ${open ? cat.border : 'var(--border)'}`, background: 'var(--card)' }}
    >
      {/* Card header — always visible */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors"
        style={{ background: open ? cat.bg : 'transparent' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: open ? 'rgba(255,255,255,0.6)' : cat.bg, border: `1px solid ${cat.border}` }}
        >
          <Icon size={16} style={{ color: cat.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{cat.label}</p>
            {assets.length > 0 && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}
              >
                {assets.length}
              </span>
            )}
          </div>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{cat.description}</p>
        </div>
        <ChevronDown
          size={16}
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
        />
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-5 pb-5 pt-1" style={{ borderTop: `1px solid ${cat.border}` }}>
          <div className="flex justify-end mb-3 pt-3">
            <button
              onClick={onUpload}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all disabled:opacity-50"
              style={{ background: cat.bg, border: `1px solid ${cat.border}`, color: cat.color }}
            >
              {uploading ? (
                <><div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />Uploading…</>
              ) : (
                <><Plus size={13} />Upload File</>
              )}
            </button>
          </div>

          {assets.length === 0 ? (
            <button
              onClick={onUpload}
              className="w-full rounded-xl px-4 py-8 text-center text-xs transition-all"
              style={{
                background: 'rgba(44,36,22,0.015)',
                border: `1.5px dashed ${cat.border}`,
                color: 'var(--text-muted)',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = cat.color)}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <div className="flex flex-col items-center gap-2">
                <Icon size={20} style={{ color: cat.color, opacity: 0.5 }} />
                <span>No files yet — click to upload</span>
              </div>
            </button>
          ) : hasImages ? (
            /* Image grid */
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {assets.map(asset => (
                <AssetRow key={asset.id} asset={asset} cat={cat} canDelete={canDelete} onDelete={onDelete} />
              ))}
            </div>
          ) : (
            /* File list */
            <div className="space-y-2">
              {assets.map(asset => (
                <AssetRow key={asset.id} asset={asset} cat={cat} canDelete={canDelete} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ProjectAssets({ projectId, initialAssets = [], canDelete = true }: Props) {
  const supabase = createClient()
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeCategory = useRef<AssetCategory>('images')
  const activeAccept = useRef<string>('')

  function openUpload(category: AssetCategory, accept: string) {
    activeCategory.current = category
    activeAccept.current = accept
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const category = activeCategory.current
    if (!category) return
    if (file.size > 50 * 1024 * 1024) { setError('File must be under 50 MB'); return }

    setError('')
    setUploading(category)

    const path = `${projectId}/${category}/${Date.now()}-${file.name}`
    const { error: uploadErr } = await supabase.storage
      .from('project-assets')
      .upload(path, file, { upsert: false })

    if (uploadErr) { setError(uploadErr.message); setUploading(null); return }

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

    if (dbErr) setError(dbErr.message)
    else if (asset) setAssets(prev => [asset as Asset, ...prev])
    setUploading(null)
  }

  async function deleteAsset(asset: Asset) {
    const pathParts = new URL(asset.file_url).pathname.split('/project-assets/')
    if (pathParts[1]) await supabase.storage.from('project-assets').remove([pathParts[1]])
    await supabase.from('project_assets').delete().eq('id', asset.id)
    setAssets(prev => prev.filter(a => a.id !== asset.id))
  }

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2 px-1">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--accent-dim)', border: '1px solid rgba(184,131,42,0.2)' }}>
          <Upload size={14} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h2 className="font-bold text-base" style={{ color: 'var(--accent)' }}>Project Assets</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Shared files — both you and your designer can see and download these
          </p>
        </div>
      </div>

      {/* Category cards */}
      {CATEGORIES.map(cat => (
        <CategoryCard
          key={cat.key}
          cat={cat}
          assets={assets.filter(a => a.category === cat.key)}
          uploading={uploading === cat.key}
          canDelete={canDelete}
          onUpload={() => openUpload(cat.key, cat.accept)}
          onDelete={deleteAsset}
        />
      ))}

      {/* Error toast */}
      {error && (
        <div className="flex items-center gap-2 text-xs px-4 py-3 rounded-xl"
          style={{ color: 'var(--danger)', background: 'rgba(192,82,74,0.08)', border: '1px solid rgba(192,82,74,0.2)' }}
        >
          <X size={13} />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={12} /></button>
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
    </div>
  )
}
