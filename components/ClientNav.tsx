'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, LogOut } from 'lucide-react'

export default function ClientNav({ clientName }: { clientName: string }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="border-b border-[#2A4A6B]" style={{ background: 'var(--surface)' }}>
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold gold-text">
          <Sparkles size={20} style={{ color: 'var(--accent)' }} />
          <span>My Journal</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm" style={{ color: 'var(--text-muted)' }}>Welcome, {clientName}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm transition-colors hover:text-[#F87171]"
            style={{ color: 'var(--text-muted)' }}
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
