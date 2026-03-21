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
      className="relative"
      style={{
        background: 'rgba(26,46,69,0.97)',
        borderBottom: '1px solid rgba(45,80,128,0.5)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Gold top stripe */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, #D4AF37 25%, #F0CC55 50%, #D4AF37 75%, transparent 100%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent-dim)', border: '1px solid rgba(212,175,55,0.3)' }}
            >
              <Sparkles size={15} style={{ color: 'var(--accent)' }} />
            </div>
            <span
              className="font-bold text-lg tracking-wide"
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #F0CC55)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Journal Portal
            </span>
          </Link>

          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all"
            style={pathname === '/admin/dashboard'
              ? { background: 'rgba(212,175,55,0.12)', color: 'var(--accent)', border: '1px solid rgba(212,175,55,0.2)' }
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
          <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm transition-all px-3 py-1.5 rounded-lg hover:text-[#F87171]"
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
