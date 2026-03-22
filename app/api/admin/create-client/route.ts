import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient()

  // Verify the caller is an admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (callerProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, email } = await req.json()
  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  let userId: string

  // Check if user already exists
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const existing = list?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

  if (existing) {
    userId = existing.id
  } else {
    // Send invite email — user sets their own password via the link
    const { data: invited, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${baseUrl}/`,
      data: { name },
    })

    if (inviteErr) {
      return NextResponse.json({ error: inviteErr.message }, { status: 500 })
    }

    userId = invited.user.id
  }

  // Upsert profile
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert({ id: userId, name, email, role: 'client' }, { onConflict: 'id' })

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 })
  }

  return NextResponse.json({ id: userId, name, email })
}
