import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * If a project is stuck in 'awaiting_deposit', check Stripe for a completed
 * checkout session and sync the database. Returns true if synced.
 */
export async function syncDepositIfPaid(projectId: string): Promise<boolean> {
  try {
    const sessions = await stripe.checkout.sessions.list({
      limit: 20,
    })

    const completed = sessions.data.find(
      s => s.metadata?.project_id === projectId &&
           s.metadata?.type === 'deposit' &&
           s.status === 'complete'
    )

    if (!completed) return false

    const paymentIntent = (completed.payment_intent as string) || 'checkout_complete'
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
