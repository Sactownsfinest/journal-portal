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
    label: 'Images',
    icon: ImageIcon,
    color: '#C0524A',          // --danger (warm red-terracotta)
    bg: 'rgba(192,82,74,0.10)',
    border: 'rgba(192,82,74,0.28)',
    accept: '.jpg,.jpeg,.png,.webp,.gif,.heic',
  },
  {
    key: 'prompts' as AssetCategory,
    label: 'Prompts',
    icon: BookOpen,
    color: '#B8832A',          // --accent gold
    bg: 'rgba(184,131,42,0.10)',
    border: 'rgba(184,131,42,0.28)',
    accept: '.pdf,.doc,.docx,.txt',
  },
  {
    key: 'story' as AssetCategory,
    label: 'Your Story',
    icon: FileText,
    color: '#8B6BAE',          // --violet
    bg: 'rgba(139,107,174,0.10)',
    border: 'rgba(139,107,174,0.28)',
    accept: '.pdf,.doc,.docx,.txt',
  },
  {
    key: 'scriptures' as AssetCategory,
    label: 'Scriptures',
    icon: Scroll,
    color: '#4A9E7F',          // --success green
    bg: 'rgba(74,158,127,0.10)',
    border: 'rgba(74,158,127,0.28)',
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

// Fixed-position image tooltip shown while hovering a file row
function FileTooltip({ asset, mouseY }: { asset: Asset; mouseY: number }) {
  if (!isImage(asset)) return null
  return (
    <div
      className="pointer-events-none fixed z-[100] rounded-2xl overflow-hidden shadow-2xl"
      style={{
        right: 420,
        top: Math.min(mouseY - 80, window.innerHeight - 220),
        width: 200,
        background: 'var(--card)',
        border: '1.5px solid var(--border)',
        boxShadow: '0 8px 32px rgba(44,36,22,0.18)',
      }}
    >
      <img src={asset.file_url} alt={asset.file_name}
        style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
      <div className="px-3 py-2">
        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{asset.file_name}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatBytes(asset.file_size)}</p>
      </div>
    </div>
  )
}

// Slide-out drawer showing files for a category
function CategoryDrawer({ cat, assets, canDelete, uploading, onUpload, onDelete, onClose }: {
  cat: typeof CATEGORIES[number]
  assets: Asset[]
  canDelete: boolean
  uploading: boolean
  onUpload: () => void
  onDelete: (a: Asset) => void
  onClose: () => void
}) {
  const Icon = cat.icon
  const [preview, setPreview] = useState<Asset | null>(null)
  const [tooltip, setTooltip] = useState<{ asset: Asset; y: number } | null>(null)

  return (
    <>
      {/* Fixed image tooltip */}
      {tooltip && <FileTooltip asset={tooltip.asset} mouseY={tooltip.y} />}

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full z-50 flex flex-col"
        style={{
          width: 'min(400px, 100vw)',
          background: 'var(--card)',
          borderLeft: `2px solid ${cat.border}`,
          boxShadow: '-8px 0 40px rgba(44,36,22,0.15)',
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center gap-3 px-6 py-5"
          style={{ background: cat.bg, borderBottom: `1px solid ${cat.border}` }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.6)', border: `1px solid ${cat.border}` }}
          >
            <Icon size={18} style={{ color: cat.color }} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold" style={{ color: cat.color }}>{cat.label}</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {assets.length} {assets.length === 1 ? 'file' : 'files'}
            </p>
          </div>
          <button
            onClick={onUpload}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all disabled:opacity-50 mr-2"
            style={{ background: 'rgba(255,255,255,0.7)', border: `1.5px solid ${cat.border}`, color: cat.color }}
          >
            {uploading
              ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              : <Plus size={13} />
            }
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <X size={18} />
          </button>
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto p-4">
          {assets.length === 0 ? (
            <button
              onClick={onUpload}
              className="w-full h-48 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all group"
              style={{ border: `1.5px dashed ${cat.border}`, color: 'var(--text-muted)' }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                style={{ background: cat.bg, border: `1px solid ${cat.border}` }}
              >
                <Icon size={24} style={{ color: cat.color }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: cat.color }}>No files yet</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Click to upload</p>
              </div>
            </button>
          ) : (
            <div className="space-y-2">
              {assets.map(asset => (
                <div
                  key={asset.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl group transition-all cursor-pointer"
                  style={{ border: '1px solid var(--border)', background: 'rgba(44,36,22,0.02)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = cat.bg
                    e.currentTarget.style.borderColor = cat.border
                    if (isImage(asset)) setTooltip({ asset, y: e.clientY })
                  }}
                  onMouseMove={e => {
                    if (isImage(asset)) setTooltip({ asset, y: e.clientY })
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(44,36,22,0.02)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                    setTooltip(null)
                  }}
                  onClick={() => isImage(asset) && setPreview(asset)}
                >
                  {isImage(asset) ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0"
                      style={{ border: `1px solid ${cat.border}` }}>
                      <img src={asset.file_url} alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
                      <FileText size={18} style={{ color: cat.color }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{asset.file_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatBytes(asset.file_size)}
                      {asset.profiles?.name ? ` · ${asset.profiles.name}` : ''}
                      {' · '}{new Date(asset.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={asset.file_url} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = cat.color)}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                      title="Download"
                    >
                      <Download size={14} />
                    </a>
                    {canDelete && (
                      <button
                        onClick={e => { e.stopPropagation(); onDelete(asset) }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image lightbox */}
      {preview && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl max-w-2xl max-h-[80vh]"
            onClick={e => e.stopPropagation()}
          >
            <img src={preview.file_url} alt={preview.file_name}
              style={{ maxWidth: '100%', maxHeight: '75vh', display: 'block', objectFit: 'contain' }} />
            <div className="absolute bottom-0 left-0 right-0 px-4 py-3"
              style={{ background: 'rgba(0,0,0,0.6)' }}>
              <p className="text-sm font-medium text-white truncate">{preview.file_name}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{formatBytes(preview.file_size)}</p>
            </div>
            <button
              onClick={() => setPreview(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-black/50 text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default function ProjectAssets({ projectId, initialAssets = [], canDelete = true }: Props) {
  const supabase = createClient()
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [openCategory, setOpenCategory] = useState<AssetCategory | null>(null)
  const [uploading, setUploading] = useState<AssetCategory | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeCategory = useRef<AssetCategory>('images')

  const openCat = CATEGORIES.find(c => c.key === openCategory) ?? null

  function triggerUpload(cat: typeof CATEGORIES[number]) {
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

      {/* 4 cards in one row */}
      <div className="grid grid-cols-4 gap-3">
        {CATEGORIES.map(cat => {
          const count = assets.filter(a => a.category === cat.key).length
          const Icon = cat.icon
          const isOpen = openCategory === cat.key

          return (
            <div
              key={cat.key}
              className="rounded-2xl overflow-hidden flex flex-col transition-all"
              style={{
                background: 'var(--card)',
                border: `1.5px solid ${isOpen || count > 0 ? cat.border : 'var(--border)'}`,
                boxShadow: isOpen ? `0 4px 20px ${cat.bg}` : 'none',
              }}
            >
              {/* Clickable body */}
              <button
                onClick={() => setOpenCategory(cat.key)}
                className="flex-1 flex flex-col items-center gap-3 px-4 py-5 text-center transition-all w-full"
                style={{ background: isOpen ? cat.bg : 'transparent' }}
                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = cat.bg }}
                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent' }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: isOpen ? 'rgba(255,255,255,0.6)' : cat.bg,
                    border: `1.5px solid ${cat.border}`,
                  }}
                >
                  <Icon size={20} style={{ color: cat.color }} />
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text)' }}>{cat.label}</p>
                  <p className="text-xs mt-1 font-semibold" style={{ color: count > 0 ? cat.color : 'var(--text-muted)' }}>
                    {count > 0 ? `${count} file${count !== 1 ? 's' : ''}` : 'No files'}
                  </p>
                </div>
              </button>

              {/* Upload button — separate from the card click */}
              <button
                onClick={e => { e.stopPropagation(); triggerUpload(cat) }}
                disabled={uploading === cat.key}
                className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all disabled:opacity-50 w-full"
                style={{
                  borderTop: `1px solid ${cat.border}`,
                  background: cat.bg,
                  color: cat.color,
                }}
              >
                {uploading === cat.key
                  ? <><div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />Uploading…</>
                  : <><Plus size={12} />Upload</>
                }
              </button>
            </div>
          )
        })}
      </div>

      {/* Drawer */}
      {openCategory && openCat && (
        <CategoryDrawer
          cat={openCat}
          assets={assets.filter(a => a.category === openCategory)}
          canDelete={canDelete}
          uploading={uploading === openCategory}
          onUpload={() => triggerUpload(openCat)}
          onDelete={deleteAsset}
          onClose={() => setOpenCategory(null)}
        />
      )}

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
