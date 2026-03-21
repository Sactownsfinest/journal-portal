'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, LayoutDashboard, LogOut } from 'lucide-react'

export default function AdminNav({ adminName }: { adminName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="border-b border-[#333] bg-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-[#c8a96e] font-bold text-lg">
            <BookOpen size={20} />
            Journal Portal
          </Link>
          <Link
            href="/admin/dashboard"
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
              pathname === '/admin/dashboard'
                ? 'bg-[#c8a96e]/10 text-[#c8a96e]'
                : 'text-[#888] hover:text-[#f5f0e8]'
            }`}
          >
            <LayoutDashboard size={15} />
            Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-[#888]">{adminName}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#e05252] transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
