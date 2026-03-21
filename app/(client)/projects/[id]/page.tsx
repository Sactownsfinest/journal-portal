import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import ApprovalPanel from '@/components/approval/ApprovalPanel'
import type { Page, Section, Invoice } from '@/types'

const FlipbookViewer = dynamic(() => import('@/components/flipbook/FlipbookViewer'), { ssr: false })

export default async function ClientProjectPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#f5f0e8]">{project.title}</h1>
        <p className="text-[#888] text-sm mt-1">Your custom 150-page journal</p>
      </div>

      {!isReadyForReview ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-4">✨</div>
          <h2 className="text-lg font-semibold mb-2">Your journal is being crafted</h2>
          <p className="text-[#888] text-sm">You'll receive an email when it's ready for your review.</p>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          {totalSections > 0 && (
            <div className="card">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold">Your Approval Progress</h2>
                <span className="text-[#c8a96e] font-bold">{approvalPct}%</span>
              </div>
              <div className="h-3 bg-[#333] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${approvalPct}%`,
                    background: approvalPct >= 100 ? '#4caf84' : 'linear-gradient(90deg, #c8a96e, #e8c98e)',
                  }}
                />
              </div>
              <p className="text-xs text-[#888] mt-2">
                {approvedSections} of {totalSections} sections approved
                {approvalPct >= 100 && ' — Journal complete! 🎉'}
              </p>
            </div>
          )}

          {/* Invoices notice */}
          {invoices && invoices.length > 0 && (
            <div className="card">
              <h2 className="font-semibold mb-3">Payment Milestones</h2>
              <div className="flex gap-3 flex-wrap">
                {([25, 50, 75, 100] as const).map(milestone => {
                  const inv = invoices.find(i => i.milestone === milestone)
                  return (
                    <div
                      key={milestone}
                      className={`flex-1 min-w-[100px] rounded-lg border p-3 text-center ${
                        inv?.status === 'paid'
                          ? 'border-[#4caf84]/30 bg-[#4caf84]/5'
                          : inv?.status === 'sent'
                          ? 'border-[#e8a030]/30 bg-[#e8a030]/5'
                          : 'border-[#333] bg-[#1a1a1a]'
                      }`}
                    >
                      <p className="text-lg font-bold text-[#c8a96e]">{milestone}%</p>
                      <p className={`text-xs mt-0.5 ${
                        inv?.status === 'paid' ? 'text-[#4caf84]' :
                        inv?.status === 'sent' ? 'text-[#e8a030]' : 'text-[#555]'
                      }`}>
                        {inv?.status === 'paid' ? 'Paid ✓' : inv?.status === 'sent' ? 'Invoice sent' : 'Upcoming'}
                      </p>
                      <p className="text-xs text-[#888] mt-0.5">${(project.total_price * 0.25).toFixed(0)}</p>
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
              <h2 className="text-lg font-semibold mb-4">Review & Approve Sections</h2>
              <p className="text-sm text-[#888] mb-6">
                Review each section of your journal. You can approve it or request changes with notes.
                Payments are processed automatically as you reach each milestone.
              </p>
              <ApprovalPanel sections={sections} projectId={params.id} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
