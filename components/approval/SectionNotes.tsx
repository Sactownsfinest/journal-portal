'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send } from 'lucide-react'

interface Note {
  id: string
  author_name: string
  author_role: 'admin' | 'client'
  content: string
  created_at: string
}

interface Props {
  sectionId: string
  viewerRole: 'admin' | 'client'
}

export default function SectionNotes({ sectionId, viewerRole }: Props) {
  const [notes, setNotes] = useState<Note[]>([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [fetching, setFetching] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('section_notes')
        .select('*')
        .eq('section_id', sectionId)
        .order('created_at')
      setNotes((data ?? []) as Note[])
      setFetching(false)
    }
    load()
  }, [sectionId])

  useEffect(() => {
    if (!fetching) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [notes, fetching])

  async function send() {
    const text = message.trim()
    if (!text || sending) return
    setSending(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSending(false); return }
    const { data: profile } = await supabase
      .from('profiles').select('name, role').eq('id', user.id).single()
    if (!profile) { setSending(false); return }

    const { data: newNote, error } = await supabase
      .from('section_notes')
      .insert({
        section_id: sectionId,
        author_id: user.id,
        author_name: profile.name,
        author_role: profile.role,
        content: text,
      })
      .select().single()

    if (!error && newNote) {
      setNotes(prev => [...prev, newNote as Note])
      setMessage('')
      inputRef.current?.focus()
    }
    setSending(false)
  }

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>

      {/* Thread */}
      <div className="px-4 py-3 space-y-4 max-h-72 overflow-y-auto">
        {fetching ? (
          <p className="text-xs text-center py-3" style={{ color: 'var(--text-muted)' }}>Loading…</p>
        ) : notes.length === 0 ? (
          <p className="text-xs text-center py-3" style={{ color: 'var(--text-muted)' }}>
            No notes yet — start the conversation.
          </p>
        ) : (
          notes.map(note => {
            const isMe = note.author_role === viewerRole
            const isAdmin = note.author_role === 'admin'
            return (
              <div key={note.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold"
                    style={{ color: isAdmin ? 'var(--accent)' : 'var(--violet)' }}>
                    {note.author_name}{isAdmin ? ' · Designer' : ''}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {new Date(note.created_at).toLocaleString(undefined, {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
                <div
                  className="text-sm rounded-2xl px-3.5 py-2 max-w-[85%] whitespace-pre-wrap"
                  style={{
                    background: isMe
                      ? isAdmin ? 'rgba(184,131,42,0.14)' : 'rgba(123,47,190,0.14)'
                      : 'var(--card)',
                    color: 'var(--text)',
                    border: '1px solid',
                    borderColor: isMe
                      ? isAdmin ? 'rgba(184,131,42,0.25)' : 'rgba(123,47,190,0.25)'
                      : 'var(--border)',
                  }}
                >
                  {note.content}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <input
          ref={inputRef}
          className="flex-1 text-sm rounded-xl px-3 py-2"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            outline: 'none',
          }}
          placeholder="Add a note…"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
          }}
        />
        <button
          onClick={send}
          disabled={!message.trim() || sending}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 shrink-0"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
