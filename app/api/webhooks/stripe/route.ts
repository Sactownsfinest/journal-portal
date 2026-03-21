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

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice
    const projectId = invoice.metadata?.project_id
    const milestone = invoice.metadata?.milestone

    if (projectId && milestone) {
      const supabase = await createServiceClient()
      await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('stripe_invoice_id', invoice.id)
    }
  }

  return NextResponse.json({ received: true })
}
