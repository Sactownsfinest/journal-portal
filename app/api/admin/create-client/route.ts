import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient()

  // Verify the caller is an admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, email, password } = await req.json()
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
  }

  // Create auth user
  const { data: newUser, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email verification
  })

  if (authErr || !newUser.user) {
    return NextResponse.json({ error: authErr?.message ?? 'Failed to create user' }, { status: 500 })
  }

  // Upsert profile with role=client
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert({ id: newUser.user.id, name, email, role: 'client' })

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 })
  }

  return NextResponse.json({ id: newUser.user.id, name, email })
}
