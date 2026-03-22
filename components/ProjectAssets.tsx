'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Upload, FileText, BookOpen, Scroll,
  Trash2, Download, Plus, X, Image as ImageIcon,
} from 'lucide-react'

type AssetCategory = 'images' | 'prompts' | 'story' | 'scriptures'

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
  canDelete?: boolean
}

const CATEGORIES = [
  {
    key: 'images' as AssetCategory,
    label: 'Images & Photos',
    icon: ImageIcon,
    color: '#5B8DB8',
    bg: 'rgba(91,141,184,0.10)',
    border: 'rgba(91,141,184,0.28)',
    accent: 'rgba(91,141,184,0.6)',
    accept: '.jpg,.jpeg,.png,.webp,.gif,.heic',
  },
  {
    key: 'prompts' as AssetCategory,
    label: 'Journal Prompts',
    icon: BookOpen,
    color: '#B8832A',
    bg: 'rgba(184,131,42,0.10)',
    border: 'rgba(184,131,42,0.28)',
    accent: 'rgba(184,131,42,0.6)',
    accept: '.pdf,.doc,.docx,.txt',
  },
  {
    key: 'story' as AssetCategory,
    label: 'Your Story',
    icon: FileText,
    color: '#8B6BAE',
    bg: 'rgba(139,107,174,0.10)',
    border: 'rgba(139,107,174,0.28)',
    accent: 'rgba(139,107,174,0.6)',
    accept: '.pdf,.doc,.docx,.txt',
  },
  {
    key: 'scriptures' as AssetCategory,
    label: 'Scriptures & Quotes',
    icon: Scroll,
    color: '#4A9E7F',
    bg: 'rgba(74,158,127,0.10)',
    border: 'rgba(74,158,127,0.28)',
    accent: 'rgba(74,158,127,0.6)',
    accept: '.pdf,.doc,.docx,.txt',
  },
] as const

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

function HoverPreview({ asset, cat }: { asset: Asset; cat: typeof CATEGORIES[number] }) {
  if (isImage(asset)) {
    return (
      <div
        className="pointer-events-none absolute z-50 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 200,
          background: 'var(--card)',
          border: '1.5px solid var(--border)',
        }}
      >
        <img src={asset.file_url} alt={asset.file_name}
          style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
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
        bottom: 'calc(100% + 8px)',
        left: '50%',
        transform: 'translateX(-50%)',
        minWidth: 170,
        background: 'var(--card)',
        border: '1.5px solid var(--border)',
      }}
    >
      <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text)' }}>{asset.file_name}</p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatBytes(asset.file_size)}</p>
    </div>
  )
}

function AssetRow({ asset, cat, canDelete, onDelete }: {
  asset: Asset
  cat: typeof CATEGORIES[number]
  canDelete: boolean
  onDelete: (a: Asset) => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl group transition-all"
      style={{
        background: hovered ? cat.bg : 'transparent',
        border: `1px solid ${hovered ? cat.border : 'transparent'}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && <HoverPreview asset={asset} cat={cat} />}

      {isImage(asset) ? (
        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0"
          style={{ border: `1px solid ${cat.border}` }}>
          <img src={asset.file_url} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
          <FileText size={14} style={{ color: cat.color }} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{asset.file_name}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {formatBytes(asset.file_size)}
          {asset.profiles?.name ? ` · ${asset.profiles.name}` : ''}
        </p>
      </div>

      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={asset.file_url} target="_blank" rel="noopener noreferrer"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = cat.color)}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          title="Open"
        >
          <Download size={13} />
        </a>
        {canDelete && (
          <button
            onClick={() => onDelete(asset)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

function CategoryCard({ cat, assets, uploading, canDelete, onUpload, onDelete }: {
  cat: typeof CATEGORIES[number]
  assets: Asset[]
  uploading: boolean
  canDelete: boolean
  onUpload: () => void
  onDelete: (a: Asset) => void
}) {
  const Icon = cat.icon
  const count = assets.length

  return (
    <div
      className="rounded-2xl flex flex-col overflow-hidden"
      style={{
        background: 'var(--card)',
        border: count > 0 ? `1.5px solid ${cat.border}` : '1.5px solid var(--border)',
        // Accent left bar
        borderLeft: `3px solid ${cat.accent}`,
      }}
    >
      {/* Card header — always visible */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: cat.bg, border: `1px solid ${cat.border}` }}
        >
          <Icon size={16} style={{ color: cat.color }} />
        </div>

        {/* Label + count */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{cat.label}</p>
            {count > 0 && (
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-full leading-none"
                style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}
              >
                {count}
              </span>
            )}
          </div>
          {count === 0 && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No files yet</p>
          )}
        </div>

        {/* Upload button */}
        <button
          onClick={onUpload}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shrink-0 disabled:opacity-50"
          style={{
            background: cat.bg,
            border: `1px solid ${cat.border}`,
            color: cat.color,
          }}
        >
          {uploading
            ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            : <Plus size={12} />
          }
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>

      {/* File list — grows naturally when files exist */}
      {count > 0 && (
        <div
          className="px-3 pb-3 space-y-0.5"
          style={{ borderTop: `1px solid ${cat.border}`, paddingTop: 8 }}
        >
          {assets.map(asset => (
            <AssetRow
              key={asset.id}
              asset={asset}
              cat={cat}
              canDelete={canDelete}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProjectAssets({ projectId, initialAssets = [], canDelete = true }: Props) {
  const supabase = createClient()
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [uploading, setUploading] = useState<AssetCategory | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeCategory = useRef<AssetCategory>('images')

  function openUpload(cat: typeof CATEGORIES[number]) {
    activeCategory.current = cat.key
    if (fileInputRef.current) {
      fileInputRef.current.accept = cat.accept
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const category = activeCategory.current
    if (file.size > 50 * 1024 * 1024) { setError('File must be under 50 MB'); return }

    setError('')
    setUploading(category)
    const path = `${projectId}/${category}/${Date.now()}-${file.name}`

    const { error: uploadErr } = await supabase.storage
      .from('project-assets').upload(path, file, { upsert: false })
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
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--accent-dim)', border: '1px solid rgba(184,131,42,0.2)' }}>
          <Upload size={14} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h2 className="font-bold text-base" style={{ color: 'var(--accent)' }}>Project Assets</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Shared files — visible to both you and your designer
          </p>
        </div>
      </div>

      {/* Single-column shelf cards */}
      <div className="flex flex-col gap-3">
        {CATEGORIES.map(cat => (
          <CategoryCard
            key={cat.key}
            cat={cat}
            assets={assets.filter(a => a.category === cat.key)}
            uploading={uploading === cat.key}
            canDelete={canDelete}
            onUpload={() => openUpload(cat)}
            onDelete={deleteAsset}
          />
        ))}
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-xs px-4 py-3 rounded-xl"
          style={{ color: 'var(--danger)', background: 'rgba(192,82,74,0.08)', border: '1px solid rgba(192,82,74,0.2)' }}
        >
          <X size={13} />{error}
          <button onClick={() => setError('')} className="ml-auto"><X size={12} /></button>
        </div>
      )}

      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
    </div>
  )
}
