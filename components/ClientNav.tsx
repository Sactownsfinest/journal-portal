'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, LogOut } from 'lucide-react'

export default function ClientNav({ clientName }: { clientName: string }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="border-b border-[#333] bg-[#1a1a1a]">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#c8a96e] font-bold">
          <BookOpen size={20} />
          My Journal
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#888]">Welcome, {clientName}</span>
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
