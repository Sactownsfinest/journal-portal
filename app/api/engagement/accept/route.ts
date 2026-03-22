import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { letterId, projectId } = await req.json()
  if (!letterId || !projectId) {
    return NextResponse.json({ error: 'Missing letterId or projectId' }, { status: 400 })
  }

  // Verify the project belongs to this client
  const { data: project } = await supabase
    .from('projects')
    .select('id, client_id')
    .eq('id', projectId)
    .eq('client_id', user.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // Accept the letter
  const { error: letterErr } = await supabase
    .from('engagement_letters')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      accepted_by: user.id,
    })
    .eq('id', letterId)
    .eq('project_id', projectId)

  if (letterErr) return NextResponse.json({ error: letterErr.message }, { status: 500 })

  // Fetch deposit amount to decide next project status
  const { data: letterData } = await supabase
    .from('engagement_letters')
    .select('deposit_amount')
    .eq('id', letterId)
    .single()

  const depositAmount = letterData?.deposit_amount ?? 0

  if (depositAmount > 0) {
    // Require deposit — set to awaiting_deposit (no-op if already there)
    await supabase
      .from('projects')
      .update({ status: 'awaiting_deposit' })
      .eq('id', projectId)
      .in('status', ['draft', 'awaiting_deposit'])
  } else {
    // No deposit required — advance directly to in_progress
    await supabase
      .from('projects')
      .update({ status: 'in_progress' })
      .eq('id', projectId)
  }

  return NextResponse.json({ success: true, depositRequired: depositAmount > 0 })
}
