import { createClient } from '@/lib/supabase/server'
import { syncDepositIfPaid } from '@/lib/sync-deposit'
import { notFound, redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import ApprovalPanel from '@/components/approval/ApprovalPanel'
import EngagementLetterGate from '@/components/EngagementLetterGate'
import DepositCheckoutButton from '@/components/DepositCheckoutButton'
import JournalProgressBar from '@/components/JournalProgressBar'
import { CheckCircle, Sparkles } from 'lucide-react'
import type { Page, Section, Invoice, EngagementLetter } from '@/types'
import ProjectAssets from '@/components/ProjectAssets'

const FlipbookViewer = dynamic(() => import('@/components/flipbook/FlipbookViewer'), { ssr: false })

export default async function ClientProjectPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { deposit?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const { data: project } = await supabase
    .from('projects')
    .select('id, title, status, total_price, client_id, total_sections')
    .eq('id', params.id)
    .eq('client_id', user.id)
    .single()

  if (!project) notFound()

  // If stuck in awaiting_deposit, check Stripe for a completed session and sync DB.
  if (project.status === 'awaiting_deposit') {
    const synced = await syncDepositIfPaid(params.id)
    if (synced) project.status = 'in_progress'
  }

  const [pagesRes, sectionsRes, invoicesRes, letterRes, assetsRes] = await Promise.all([
    supabase.from('pages').select('*').eq('project_id', params.id).order('order_index'),
    supabase.from('sections').select('*').eq('project_id', params.id).order('page_start'),
    supabase.from('invoices').select('*').eq('project_id', params.id).order('milestone'),
    supabase.from('engagement_letters').select('*').eq('project_id', params.id).maybeSingle(),
    supabase.from('project_assets').select('*, profiles(name)').eq('project_id', params.id).order('created_at', { ascending: false }),
  ])
  const pages = pagesRes.data as Page[] | null
  const sections = sectionsRes.data as Section[] | null
  const invoices = invoicesRes.data as Invoice[] | null
  const engagementLetter = letterRes.data as EngagementLetter | null
  const initialAssets = assetsRes.data ?? []

  const createdSections = sections?.length ?? 0
  const approvedSections = sections?.filter(s => s.status === 'approved').length ?? 0
  const totalSections = (project as any).total_sections ?? createdSections
  const approvalPct = totalSections > 0 ? Math.round((approvedSections / totalSections) * 100) : 0
  const isReadyForReview = project.status === 'ready_for_review' || project.status === 'complete'
  const needsLetterAcceptance = engagementLetter && engagementLetter.status !== 'accepted'

  // Gate: show engagement letter if not yet accepted
  if (needsLetterAcceptance) {
    return (
      <EngagementLetterGate
        letter={engagementLetter}
        projectId={params.id}
        projectTitle={project.title}
        clientName={profile?.name ?? 'Client'}
      />
    )
  }

  return (
    <div className="space-y-6 md:space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold gold-text">{project.title}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>Your custom journal</p>
      </div>

      {/* Deposit success banner */}
      {searchParams.deposit === 'success' && (
        <div
          className="rounded-2xl px-6 py-5 flex items-center gap-4"
          style={{ background: 'rgba(74,158,127,0.10)', border: '1px solid rgba(74,158,127,0.3)' }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(74,158,127,0.12)', border: '1px solid rgba(74,158,127,0.25)' }}>
            <CheckCircle size={22} style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--success)' }}>Deposit received — we&apos;re getting started!</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              You&apos;ll receive an email update as we begin crafting your journal.
            </p>
          </div>
        </div>
      )}

      {/* Deposit required banner */}
      {project.status === 'awaiting_deposit' && engagementLetter && !engagementLetter.stripe_deposit_invoice_id && searchParams.deposit !== 'success' && (
        <div className="card-glow">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles size={16} style={{ color: 'var(--accent)' }} />
            <span className="font-bold" style={{ color: 'var(--accent)' }}>One step before we begin</span>
          </div>
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div>
              <p className="font-medium mb-1" style={{ color: 'var(--text)' }}>Submit your deposit to kick off your journal</p>
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                A deposit of{' '}
                <span style={{ color: 'var(--accent)' }}>${engagementLetter.deposit_amount.toLocaleString()}</span>{' '}
                is required to begin work.
              </p>
            </div>
            <DepositCheckoutButton projectId={params.id} depositAmount={engagementLetter.deposit_amount} />
          </div>
        </div>
      )}

      {/* Progress bar — show whenever project is active (in_progress, ready_for_review, complete) */}
      {(project.status === 'in_progress' || project.status === 'ready_for_review' || project.status === 'complete') && (
        <JournalProgressBar
          approvalPct={approvalPct}
          approvedSections={approvedSections}
          totalSections={totalSections}
          invoices={invoices ?? []}
          totalPrice={project.total_price}
          depositPaid={!!(engagementLetter?.stripe_deposit_invoice_id)}
          depositAmount={engagementLetter?.deposit_amount ?? 0}
        />
      )}

      {/* Project Assets */}
      <ProjectAssets projectId={params.id} initialAssets={initialAssets as any} canDelete={false} />

      {/* Full flipbook — only when ready for review or complete */}
      {isReadyForReview && pages && pages.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--accent)' }}>Your Journal Preview</h2>
          <div className="flex justify-center">
            <FlipbookViewer pages={pages} />
          </div>
        </div>
      )}

      {/* Sections — always shown; each card has a Preview button */}
      {sections && sections.length > 0 ? (
        <div>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--accent)' }}>Review &amp; Approve Sections</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Review each section of your journal and approve or request changes.
            You can preview any section at any time using the Preview button.
          </p>
          <ApprovalPanel sections={sections} projectId={params.id} pages={pages ?? []} />
        </div>
      ) : (
        <div className="card text-center py-20">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'var(--violet-dim)', border: '1.5px solid rgba(139,107,174,0.2)' }}>
            <span className="text-4xl">✨</span>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--accent)' }}>Your journal is being crafted</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            You&apos;ll receive an email when it&apos;s ready for your review.
          </p>
        </div>
      )}
    </div>
  )
}
