import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import ApprovalPanel from '@/components/approval/ApprovalPanel'
import ClientNav from '@/components/ClientNav'
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
    .select('id, title, status, total_price, client_id')
    .eq('id', params.id)
    .eq('client_id', user.id)
    .single()

  if (!project) notFound()

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

  const totalSections = sections?.length ?? 0
  const approvedSections = sections?.filter(s => s.status === 'approved').length ?? 0
  const approvalPct = totalSections > 0 ? Math.round((approvedSections / totalSections) * 100) : 0

  const isReadyForReview = project.status === 'ready_for_review' || project.status === 'complete'

  // Gate: if a letter was sent but not yet accepted, show the review screen
  const needsLetterAcceptance = engagementLetter && engagementLetter.status !== 'accepted'

  if (needsLetterAcceptance) {
    return (
      <div className="min-h-screen flex flex-col">
        <ClientNav clientName={profile?.name ?? 'there'} />
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 30% at 50% 0%, rgba(212,175,55,0.06) 0%, transparent 60%)' }}
        />
        <main className="flex-1 relative">
          <EngagementLetterGate
            letter={engagementLetter}
            projectId={params.id}
            projectTitle={project.title}
            clientName={profile?.name ?? 'Client'}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ClientNav clientName={profile?.name ?? 'there'} />

      {/* Background accent */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 30% at 50% 0%, rgba(184,131,42,0.06) 0%, transparent 60%)',
        }}
      />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-10 relative">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold gold-text">{project.title}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your custom 150-page journal</p>
        </div>

        {/* Deposit success banner */}
        {searchParams.deposit === 'success' && (
          <div
            className="rounded-2xl px-6 py-5 flex items-center gap-4"
            style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.3)' }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.25)' }}
            >
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
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'linear-gradient(135deg, rgba(30,52,84,0.9), rgba(26,46,69,0.9))' }}
          >
            <div
              className="px-6 py-4 flex items-center gap-3"
              style={{ borderBottom: '1px solid rgba(212,175,55,0.15)', background: 'rgba(212,175,55,0.05)' }}
            >
              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
              <span className="font-semibold" style={{ color: 'var(--accent)' }}>One step before we begin</span>
            </div>
            <div className="px-6 py-5 flex items-center justify-between gap-6 flex-wrap">
              <div>
                <p className="font-medium mb-1">Submit your deposit to kick off your journal</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Your engagement letter has been accepted. A deposit of{' '}
                  <span style={{ color: 'var(--accent)' }}>${engagementLetter.deposit_amount.toLocaleString()}</span> is required to begin work.
                </p>
              </div>
              <DepositCheckoutButton
                projectId={params.id}
                depositAmount={engagementLetter.deposit_amount}
              />
            </div>
          </div>
        )}

        {/* Project Assets — shared file uploads */}
        <ProjectAssets projectId={params.id} initialAssets={initialAssets as any} />

        {!isReadyForReview ? (
          <div className="card-glow text-center py-20">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'var(--violet-dim)', border: '1.5px solid rgba(139,107,174,0.2)' }}
            >
              <span className="text-4xl">✨</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Your journal is being crafted</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              You&apos;ll receive an email when it&apos;s ready for your review.
            </p>
          </div>
        ) : (
          <>
            {/* Progress bar with book + milestones */}
            {totalSections > 0 && (
              <JournalProgressBar
                approvalPct={approvalPct}
                approvedSections={approvedSections}
                totalSections={totalSections}
                invoices={invoices ?? []}
                totalPrice={project.total_price}
              />
            )}

            {/* Flipbook */}
            {pages && pages.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Your Journal Preview</h2>
                <div className="flex justify-center">
                  <FlipbookViewer pages={pages} />
                </div>
              </div>
            )}

            {/* Section approval */}
            {sections && sections.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Review &amp; Approve Sections</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                  Review each section of your journal. You can approve it or request changes with notes.
                  Payments are processed automatically as you reach each milestone.
                </p>
                <ApprovalPanel sections={sections} projectId={params.id} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
