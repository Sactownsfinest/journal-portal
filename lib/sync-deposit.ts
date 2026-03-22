import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * If a project is stuck in 'awaiting_deposit', check Stripe for a completed
 * checkout session and sync the database. Returns true if synced.
 */
export async function syncDepositIfPaid(projectId: string): Promise<boolean> {
  try {
    const sessions = await stripe.checkout.sessions.search({
      query: `metadata['project_id']:'${projectId}' AND metadata['type']:'deposit' AND status:'complete'`,
      limit: 1,
    })

    if (sessions.data.length === 0) return false

    const paymentIntent = (sessions.data[0].payment_intent as string) || 'checkout_complete'
    const service = await createServiceClient()

    await Promise.all([
      service.from('projects').update({ status: 'in_progress' }).eq('id', projectId),
      service.from('engagement_letters')
        .update({ stripe_deposit_invoice_id: paymentIntent })
        .eq('project_id', projectId)
        .is('stripe_deposit_invoice_id', null),
    ])

    return true
  } catch {
    return false
  }
}
