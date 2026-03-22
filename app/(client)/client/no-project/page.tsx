import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientNav from '@/components/ClientNav'
import { BookOpen, Mail } from 'lucide-react'

export default async function NoProjectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen flex flex-col">
      <ClientNav clientName={profile?.name ?? 'there'} />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'var(--accent-dim)', border: '1.5px solid rgba(184,131,42,0.2)' }}
          >
            <BookOpen size={34} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-2xl font-bold gold-text mb-3">Your journal is on its way</h1>
          <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
            No project has been assigned to your account yet. Once your designer sets up your journal, you'll be able to review it right here.
          </p>
          <div
            className="rounded-2xl px-5 py-4 flex items-center gap-3 text-left"
            style={{ background: 'var(--accent-dim)', border: '1px solid rgba(184,131,42,0.2)' }}
          >
            <Mail size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              You'll receive an email as soon as your project is ready for review.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
