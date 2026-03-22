import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient()

  // Verify the caller is an admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (callerProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, email, password } = await req.json()
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
  }

  let userId: string

  // Try to create auth user
  const { data: newUser, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authErr) {
    // If already registered, find the existing user by listing and matching email
    if (authErr.message.toLowerCase().includes('already')) {
      const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      const existing = list?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
      if (!existing) {
        return NextResponse.json({ error: 'User exists but could not be found. Check Supabase auth.' }, { status: 500 })
      }
      userId = existing.id
    } else {
      return NextResponse.json({ error: authErr.message }, { status: 500 })
    }
  } else {
    userId = newUser.user!.id
  }

  // Upsert profile with role=client (works for both new and existing users)
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert({ id: userId, name, email, role: 'client' }, { onConflict: 'id' })

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 })
  }

  return NextResponse.json({ id: userId, name, email })
}
