import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookOpen, Mail } from 'lucide-react'

export default async function NoProjectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--accent-dim)', border: '1.5px solid rgba(184,131,42,0.2)' }}
        >
          <BookOpen size={34} style={{ color: 'var(--accent)' }} />
        </div>
        <h1 className="text-2xl font-bold gold-text mb-3">Your journal is on its way</h1>
        <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
          No project has been assigned to your account yet. Once your designer sets up your journal, you&apos;ll be able to review it right here.
        </p>
        <div
          className="card flex items-center gap-3 text-left"
        >
          <Mail size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <p className="text-sm" style={{ color: 'var(--text)' }}>
            You&apos;ll receive an email as soon as your project is ready for review.
          </p>
        </div>
      </div>
    </div>
  )
}
