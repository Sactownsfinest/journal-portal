'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, LogOut, Sparkles } from 'lucide-react'

export default function AdminNav({ adminName }: { adminName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav
      style={{
        background: 'rgba(255,255,255,0.88)',
        borderBottom: '1.5px solid var(--border)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 1px 12px rgba(44,36,22,0.06)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent-dim)', border: '1.5px solid rgba(184,131,42,0.25)' }}
            >
              <Sparkles size={15} style={{ color: 'var(--accent)' }} />
            </div>
            <span className="font-bold text-lg tracking-wide gold-text">
              Journal Portal
            </span>
          </Link>

          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all"
            style={pathname === '/admin/dashboard'
              ? { background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(184,131,42,0.2)' }
              : { color: 'var(--text-muted)', border: '1px solid transparent' }
            }
          >
            <LayoutDashboard size={14} />
            Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{adminName}</span>
            <span className="badge-gold" style={{ fontSize: '10px', padding: '1px 8px' }}>Admin</span>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-strong)' }} />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm transition-all px-3 py-1.5 rounded-lg"
            style={{ color: 'var(--text-muted)' }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
