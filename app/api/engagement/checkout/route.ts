import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await req.json()
  if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

  // Verify project belongs to this client
  const { data: project } = await supabase
    .from('projects')
    .select('id, title, status, total_price, client_id')
    .eq('id', projectId)
    .eq('client_id', user.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // Get engagement letter for deposit amount
  const { data: letter } = await supabase
    .from('engagement_letters')
    .select('id, deposit_amount, status, stripe_deposit_invoice_id')
    .eq('project_id', projectId)
    .single()

  if (!letter) return NextResponse.json({ error: 'No engagement letter found' }, { status: 404 })
  if (letter.status !== 'accepted') return NextResponse.json({ error: 'Letter not yet accepted' }, { status: 400 })
  if (letter.stripe_deposit_invoice_id) return NextResponse.json({ error: 'Deposit already paid' }, { status: 400 })

  const depositCents = Math.round(letter.deposit_amount * 100)
  if (depositCents < 50) return NextResponse.json({ error: 'Deposit amount too small' }, { status: 400 })

  // Get client email for Stripe
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', user.id)
    .single()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ?? (req.headers.get('origin') || 'http://localhost:3000')

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: profile?.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: depositCents,
          product_data: {
            name: `Deposit — ${project.title}`,
            description: `Project deposit to begin work on your custom journal`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'deposit',
      project_id: projectId,
      letter_id: letter.id,
    },
    success_url: `${baseUrl}/client/projects/${projectId}?deposit=success`,
    cancel_url: `${baseUrl}/client/projects/${projectId}`,
  })

  return NextResponse.json({ url: session.url })
}
