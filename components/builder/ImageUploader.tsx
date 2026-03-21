'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, ImageIcon } from 'lucide-react'

interface Props {
  value?: string
  onChange: (url: string) => void
  projectId: string
}

export default function ImageUploader({ value, onChange, projectId }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB')
      return
    }

    setError('')
    setUploading(true)

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${projectId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('project-assets')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('project-assets').getPublicUrl(path)
    onChange(data.publicUrl)
    setUploading(false)
  }

  function clearImage() {
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-[#333] group">
          <img src={value} alt="Page asset" className="w-full h-40 object-cover" />
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-32 border-2 border-dashed border-[#333] hover:border-[#c8a96e]/50 rounded-lg flex flex-col items-center justify-center gap-2 text-[#888] hover:text-[#c8a96e] transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <div className="w-5 h-5 border-2 border-[#c8a96e] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Uploading…</span>
            </>
          ) : (
            <>
              <Upload size={20} />
              <span className="text-xs">Click to upload image</span>
              <span className="text-xs text-[#555]">JPG, PNG, WebP · max 10MB</span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-[#e05252] mt-1">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
