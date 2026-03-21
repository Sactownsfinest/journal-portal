'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, LayoutDashboard, LogOut, Sparkles } from 'lucide-react'

export default function AdminNav({ adminName }: { adminName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="border-b border-[#2A4A6B]" style={{ background: 'var(--surface)' }}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-lg gold-text">
            <Sparkles size={20} style={{ color: 'var(--accent)' }} />
            Journal Portal
          </Link>
          <Link
            href="/admin/dashboard"
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
              pathname === '/admin/dashboard'
                ? 'text-[#D4AF37]'
                : 'hover:text-[#F8F4E3]'
            }`}
            style={pathname === '/admin/dashboard'
              ? { background: 'rgba(212,175,55,0.12)', color: 'var(--accent)' }
              : { color: 'var(--text-muted)' }
            }
          >
            <LayoutDashboard size={15} />
            Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{adminName}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm transition-colors hover:text-[#F87171]"
            style={{ color: 'var(--text-muted)' }}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
