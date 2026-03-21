import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import type { Section, Invoice, Project } from '@/types'

const MILESTONES = [25, 50, 75, 100] as const

export async function checkAndFireMilestones(projectId: string) {
  const supabase = await createServiceClient()

  // Fetch project
  const { data: project } = await supabase
    .from('projects')
    .select('*, profiles(*)')
    .eq('id', projectId)
    .single()

  if (!project) return

  // Fetch all sections
  const { data: sections } = await supabase
    .from('sections')
    .select('*')
    .eq('project_id', projectId)

  if (!sections || sections.length === 0) return

  const totalSections = sections.length
  const approvedSections = sections.filter((s: { status: string }) => s.status === 'approved').length
  const approvalPct = Math.floor((approvedSections / totalSections) * 100)

  // Fetch existing invoices
  const { data: existingInvoices } = await supabase
    .from('invoices')
    .select('milestone')
    .eq('project_id', projectId)

  const firedMilestones = new Set((existingInvoices ?? []).map((i: { milestone: number }) => i.milestone))

  for (const milestone of MILESTONES) {
    if (approvalPct >= milestone && !firedMilestones.has(milestone)) {
      await createMilestoneInvoice({
        project,
        milestone,
        clientEmail: project.profiles?.email ?? '',
        clientName: project.profiles?.name ?? 'Client',
      })
    }
  }

  // Mark project complete when fully approved
  if (approvalPct >= 100) {
    await supabase
      .from('projects')
      .update({ status: 'complete' })
      .eq('id', projectId)
  }
}

async function createMilestoneInvoice({
  project,
  milestone,
  clientEmail,
  clientName,
}: {
  project: any
  milestone: number
  clientEmail: string
  clientName: string
}) {
  const supabase = await createServiceClient()
  const amount = Math.round(project.total_price * 0.25 * 100) // cents

  // Get or create Stripe customer
  const existing = await stripe.customers.list({ email: clientEmail, limit: 1 })
  let customer: Stripe.Customer

  if (existing.data.length > 0) {
    customer = existing.data[0]
  } else {
    customer = await stripe.customers.create({
      email: clientEmail,
      name: clientName,
      metadata: { project_id: project.id },
    })
  }

  // Create invoice
  const invoice = await stripe.invoices.create({
    customer: customer.id,
    collection_method: 'send_invoice',
    days_until_due: 7,
    description: `${project.title} — ${milestone}% Milestone Payment`,
    metadata: { milestone: String(milestone), project_id: project.id },
  })

  // Add line item
  await stripe.invoices.addLines(invoice.id, {
    lines: [
      {
        description: `${project.title} — ${milestone}% milestone payment`,
        amount,
        quantity: 1,
      },
    ],
  })

  // Send (auto-finalizes)
  await stripe.invoices.sendInvoice(invoice.id)

  // Save to DB
  await supabase.from('invoices').insert({
    project_id: project.id,
    milestone,
    stripe_invoice_id: invoice.id,
    stripe_customer_id: customer.id,
    amount: project.total_price * 0.25,
    status: 'sent',
  })
}
