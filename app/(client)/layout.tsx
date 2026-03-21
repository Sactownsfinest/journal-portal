import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ClientNav from '@/components/ClientNav'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'client') redirect('/admin/dashboard')

  return (
    <div className="min-h-screen flex flex-col">
      <ClientNav clientName={profile.name} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  )
}
