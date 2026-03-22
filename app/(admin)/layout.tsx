import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminNav from '@/components/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/login')

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: "url('/dashboard-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <AdminNav adminName={profile.name} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  )
}
