import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

// Called server-side (from the page) when a project is stuck in awaiting_deposit.
// Checks Stripe for a completed checkout session and syncs the DB if found.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ synced: false })

  const { projectId } = await req.json()
  if (!projectId) return NextResponse.json({ synced: false })

  // Verify project belongs to this user
  const { data: project } = await supabase
    .from('projects')
    .select('id, status')
    .eq('id', projectId)
    .eq('client_id', user.id)
    .single()

  if (!project || project.status !== 'awaiting_deposit') {
    return NextResponse.json({ synced: false })
  }

  try {
    const sessions = await stripe.checkout.sessions.search({
      query: `metadata['project_id']:'${projectId}' AND metadata['type']:'deposit' AND status:'complete'`,
      limit: 1,
    })

    if (sessions.data.length === 0) {
      return NextResponse.json({ synced: false })
    }

    const paymentIntent = sessions.data[0].payment_intent as string
    const service = await createServiceClient()

    await Promise.all([
      service.from('projects').update({ status: 'in_progress' }).eq('id', projectId),
      service.from('engagement_letters')
        .update({ stripe_deposit_invoice_id: paymentIntent || 'checkout_complete' })
        .eq('project_id', projectId)
        .is('stripe_deposit_invoice_id', null),
    ])

    return NextResponse.json({ synced: true })
  } catch {
    return NextResponse.json({ synced: false })
  }
}
