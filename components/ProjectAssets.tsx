'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Upload, FileText, BookOpen, Scroll, Trash2, Download,
  Plus, X, Image as ImageIcon,
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

const TABS: {
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
    label: 'Images',
    description: 'Photos, graphics, or inspiration images for your journal',
    icon: ImageIcon,
    color: '#5B8DB8',
    bg: 'rgba(91,141,184,0.12)',
    border: 'rgba(91,141,184,0.3)',
    accept: '.jpg,.jpeg,.png,.webp,.gif,.heic',
  },
  {
    key: 'prompts',
    label: 'Prompts',
    description: 'Writing prompts, questions, or topics for journal pages',
    icon: BookOpen,
    color: '#B8832A',
    bg: 'rgba(184,131,42,0.12)',
    border: 'rgba(184,131,42,0.3)',
    accept: '.pdf,.doc,.docx,.txt',
  },
  {
    key: 'story',
    label: 'Your Story',
    description: 'Personal narrative, biography, or life story content',
    icon: FileText,
    color: '#8B6BAE',
    bg: 'rgba(139,107,174,0.12)',
    border: 'rgba(139,107,174,0.3)',
    accept: '.pdf,.doc,.docx,.txt',
  },
  {
    key: 'scriptures',
    label: 'Scriptures',
    description: 'Favorite verses, quotes, or inspirational passages',
    icon: Scroll,
    color: '#4A9E7F',
    bg: 'rgba(74,158,127,0.12)',
    border: 'rgba(74,158,127,0.3)',
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

function HoverPreview({ asset, cat }: { asset: Asset; cat: typeof TABS[0] }) {
  if (isImage(asset)) {
    return (
      <div
        className="pointer-events-none absolute z-50 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          bottom: 'calc(100% + 10px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 200,
          background: 'var(--card)',
          border: '1.5px solid var(--border)',
        }}
      >
        <img src={asset.file_url} alt={asset.file_name}
          style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
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
        minWidth: 180,
        background: 'var(--card)',
        border: '1.5px solid var(--border)',
      }}
    >
      <p className="text-xs font-semibold leading-tight mb-1" style={{ color: 'var(--text)' }}>{asset.file_name}</p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatBytes(asset.file_size)}</p>
      <p className="text-xs mt-1.5 font-medium" style={{ color: cat.color }}>Click ↓ to open</p>
    </div>
  )
}

function AssetRow({ asset, cat, canDelete, onDelete }: {
  asset: Asset
  cat: typeof TABS[0]
  canDelete: boolean
  onDelete: (a: Asset) => void
}) {
  const [hovered, setHovered] = useState(false)
  const img = isImage(asset)

  return (
    <div
      className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 group transition-all"
      style={{
        background: hovered ? cat.bg : 'transparent',
        border: `1px solid ${hovered ? cat.border : 'var(--border)'}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && <HoverPreview asset={asset} cat={cat} />}

      {img ? (
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0"
          style={{ border: `1px solid ${cat.border}` }}>
          <img src={asset.file_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
          <FileText size={16} style={{ color: cat.color }} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{asset.file_name}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {formatBytes(asset.file_size)}
          {asset.profiles?.name && ` · ${asset.profiles.name}`}
          {' · '}{new Date(asset.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={asset.file_url} target="_blank" rel="noopener noreferrer"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-muted)' }}
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
  )
}

export default function ProjectAssets({ projectId, initialAssets = [], canDelete = true }: Props) {
  const supabase = createClient()
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [activeTab, setActiveTab] = useState<AssetCategory>('images')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tab = TABS.find(t => t.key === activeTab)!
  const tabAssets = assets.filter(a => a.category === activeTab)

  function openUpload() {
    if (fileInputRef.current) {
      fileInputRef.current.accept = tab.accept
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) { setError('File must be under 50 MB'); return }

    setError('')
    setUploading(true)
    const path = `${projectId}/${activeTab}/${Date.now()}-${file.name}`

    const { error: uploadErr } = await supabase.storage
      .from('project-assets').upload(path, file, { upsert: false })

    if (uploadErr) { setError(uploadErr.message); setUploading(false); return }

    const { data: urlData } = supabase.storage.from('project-assets').getPublicUrl(path)
    const { data: asset, error: dbErr } = await supabase
      .from('project_assets')
      .insert({
        project_id: projectId,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        category: activeTab,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
      })
      .select('*, profiles(name)')
      .single()

    if (dbErr) setError(dbErr.message)
    else if (asset) setAssets(prev => [asset as Asset, ...prev])
    setUploading(false)
  }

  async function deleteAsset(asset: Asset) {
    const pathParts = new URL(asset.file_url).pathname.split('/project-assets/')
    if (pathParts[1]) await supabase.storage.from('project-assets').remove([pathParts[1]])
    await supabase.from('project_assets').delete().eq('id', asset.id)
    setAssets(prev => prev.filter(a => a.id !== asset.id))
  }

  return (
    <div>
      {/* Section label */}
      <div className="flex items-center gap-2 mb-5">
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

      {/* Tab strip */}
      <div
        className="flex items-center gap-2 p-1.5 rounded-2xl mb-4"
        style={{ background: 'rgba(44,36,22,0.04)', border: '1px solid var(--border)' }}
      >
        {TABS.map(t => {
          const isActive = t.key === activeTab
          const count = assets.filter(a => a.category === t.key).length
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: isActive ? t.bg : 'transparent',
                border: isActive ? `1.5px solid ${t.border}` : '1.5px solid transparent',
                color: isActive ? t.color : 'var(--text-muted)',
                boxShadow: isActive ? `0 2px 8px ${t.bg}` : 'none',
              }}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{t.label}</span>
              {count > 0 && (
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full leading-none"
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.5)' : t.bg,
                    color: t.color,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content panel */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          border: `1.5px solid ${tab.border}`,
          background: 'var(--card)',
        }}
      >
        {/* Panel header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{
            background: tab.bg,
            borderBottom: `1px solid ${tab.border}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.55)', border: `1px solid ${tab.border}` }}
            >
              <tab.icon size={16} style={{ color: tab.color }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: tab.color }}>{tab.label}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{tab.description}</p>
            </div>
          </div>

          <button
            onClick={openUpload}
            disabled={uploading}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
            style={{
              background: 'rgba(255,255,255,0.7)',
              border: `1.5px solid ${tab.border}`,
              color: tab.color,
              boxShadow: '0 1px 4px rgba(44,36,22,0.06)',
            }}
          >
            {uploading ? (
              <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Uploading…</>
            ) : (
              <><Plus size={14} />Upload</>
            )}
          </button>
        </div>

        {/* File list */}
        <div className="p-4">
          {tabAssets.length === 0 ? (
            <button
              onClick={openUpload}
              className="w-full rounded-xl py-12 flex flex-col items-center gap-3 transition-all group"
              style={{
                background: 'transparent',
                border: `1.5px dashed ${tab.border}`,
                color: 'var(--text-muted)',
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                style={{ background: tab.bg, border: `1px solid ${tab.border}` }}
              >
                <tab.icon size={20} style={{ color: tab.color }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: tab.color }}>
                  No {tab.label.toLowerCase()} yet
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Click to upload your first file
                </p>
              </div>
            </button>
          ) : (
            <div className="space-y-2">
              {tabAssets.map(asset => (
                <AssetRow
                  key={asset.id}
                  asset={asset}
                  cat={tab}
                  canDelete={canDelete}
                  onDelete={deleteAsset}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-xs px-4 py-3 rounded-xl"
          style={{ color: 'var(--danger)', background: 'rgba(192,82,74,0.08)', border: '1px solid rgba(192,82,74,0.2)' }}
        >
          <X size={13} />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={12} /></button>
        </div>
      )}

      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
    </div>
  )
}
