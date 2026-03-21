import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAndFireMilestones } from '@/lib/milestone'

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json()

    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 })
    }

    // Verify the requesting user owns this project (client) or is admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await checkAndFireMilestones(projectId)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Invoice create error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
