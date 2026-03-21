import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Milestone invoice paid (via Stripe Invoice API)
  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice
    const projectId = invoice.metadata?.project_id
    const milestone = invoice.metadata?.milestone

    if (projectId && milestone) {
      await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('stripe_invoice_id', invoice.id)
    }
  }

  // Deposit paid (via Stripe Checkout Session)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.metadata?.type === 'deposit') {
      const { project_id, letter_id } = session.metadata

      // Record payment intent ID on the letter
      await supabase
        .from('engagement_letters')
        .update({ stripe_deposit_invoice_id: session.payment_intent as string })
        .eq('id', letter_id)

      // Move project from awaiting_deposit → in_progress
      await supabase
        .from('projects')
        .update({ status: 'in_progress' })
        .eq('id', project_id)
        .eq('status', 'awaiting_deposit')
    }
  }

  return NextResponse.json({ received: true })
}
