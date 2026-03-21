import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import ApprovalPanel from '@/components/approval/ApprovalPanel'
import ClientNav from '@/components/ClientNav'
import type { Page, Section, Invoice } from '@/types'

const FlipbookViewer = dynamic(() => import('@/components/flipbook/FlipbookViewer'), { ssr: false })

export default async function ClientProjectPage({ params }: { params: { id: string } }) {
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

  const [pagesRes, sectionsRes, invoicesRes] = await Promise.all([
    supabase.from('pages').select('*').eq('project_id', params.id).order('order_index'),
    supabase.from('sections').select('*').eq('project_id', params.id).order('page_start'),
    supabase.from('invoices').select('*').eq('project_id', params.id).order('milestone'),
  ])
  const pages = pagesRes.data as Page[] | null
  const sections = sectionsRes.data as Section[] | null
  const invoices = invoicesRes.data as Invoice[] | null

  const totalSections = sections?.length ?? 0
  const approvedSections = sections?.filter(s => s.status === 'approved').length ?? 0
  const approvalPct = totalSections > 0 ? Math.round((approvedSections / totalSections) * 100) : 0

  const isReadyForReview = project.status === 'ready_for_review' || project.status === 'complete'

  return (
    <div className="min-h-screen flex flex-col">
      <ClientNav clientName={profile?.name ?? 'there'} />

      {/* Background accent */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 30% at 50% 0%, rgba(123,47,190,0.06) 0%, transparent 60%)',
        }}
      />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-10 relative">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold gold-text">{project.title}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your custom 150-page journal</p>
        </div>

        {!isReadyForReview ? (
          <div className="card-glow text-center py-20">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'var(--violet-dim)', border: '1px solid rgba(123,47,190,0.3)' }}
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
            {/* Progress bar */}
            {totalSections > 0 && (
              <div className="card-glow">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-semibold">Your Approval Progress</h2>
                  <span className="font-bold text-xl gold-text">{approvalPct}%</span>
                </div>
                <div className="progress-bar h-4">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${approvalPct}%`,
                      background: approvalPct >= 100
                        ? 'var(--success)'
                        : 'linear-gradient(90deg, #D4AF37, #7B2FBE)',
                    }}
                  />
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  {approvedSections} of {totalSections} sections approved
                  {approvalPct >= 100 && (
                    <span style={{ color: 'var(--success)' }}> — Journal complete! 🎉</span>
                  )}
                </p>
              </div>
            )}

            {/* Invoices */}
            {invoices && invoices.length > 0 && (
              <div className="card">
                <h2 className="font-semibold mb-4">Payment Milestones</h2>
                <div className="flex gap-3 flex-wrap">
                  {([25, 50, 75, 100] as const).map(milestone => {
                    const inv = invoices.find(i => i.milestone === milestone)
                    const isPaid = inv?.status === 'paid'
                    const isSent = inv?.status === 'sent'
                    return (
                      <div
                        key={milestone}
                        className="flex-1 min-w-[100px] rounded-xl border p-3 text-center transition-all"
                        style={{
                          borderColor: isPaid ? 'rgba(45,212,191,0.3)' : isSent ? 'rgba(251,191,36,0.3)' : 'var(--border)',
                          background: isPaid ? 'rgba(45,212,191,0.06)' : isSent ? 'rgba(251,191,36,0.06)' : 'var(--surface)',
                        }}
                      >
                        <p className="text-xl font-bold gold-text">{milestone}%</p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: isPaid ? 'var(--success)' : isSent ? 'var(--warning)' : 'var(--text-muted)' }}
                        >
                          {isPaid ? 'Paid ✓' : isSent ? 'Invoice sent' : 'Upcoming'}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--accent)' }}>
                          ${(project.total_price * 0.25).toFixed(0)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
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
