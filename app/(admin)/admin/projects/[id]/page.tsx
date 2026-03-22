import { createClient } from '@/lib/supabase/server'
import { syncDepositIfPaid } from '@/lib/sync-deposit'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Pencil, CheckCircle, XCircle, Clock, Download, FileText, ChevronDown } from 'lucide-react'
import InvoiceTimeline from '@/components/billing/InvoiceTimeline'
import ProjectStatusUpdater from '@/components/ProjectStatusUpdater'
import SectionManager from '@/components/approval/SectionManager'
import EngagementLetterEditor from '@/components/EngagementLetterEditor'
import ProjectAssets from '@/components/ProjectAssets'
import AssignClientPanel from '@/components/AssignClientPanel'
import SectionRow from '@/components/approval/SectionRow'
import TotalSectionsEditor from '@/components/TotalSectionsEditor'
import type { Section, Invoice, Page, Project, EngagementLetter } from '@/types'

export default async function AdminProjectPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: projectRaw } = await supabase
    .from('projects')
    .select('*, profiles(name, email)')
    .eq('id', params.id)
    .single() as { data: (Project & { profiles: { name: string; email: string } } & { total_sections?: number | null }) | null }

  if (!projectRaw) notFound()
  const project = projectRaw!

  // Sync deposit status if stuck
  if (project.status === 'awaiting_deposit') {
    const synced = await syncDepositIfPaid(params.id)
    if (synced) project.status = 'in_progress'
  }

  const { data: allClients } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('role', 'client')
    .order('name')

  const [pagesRes, sectionsRes, invoicesRes, letterRes, assetsRes] = await Promise.all([
    supabase.from('pages').select('id, order_index, template_type, content, status').eq('project_id', params.id).order('order_index'),
    supabase.from('sections').select('*').eq('project_id', params.id).order('page_start'),
    supabase.from('invoices').select('*').eq('project_id', params.id).order('milestone'),
    supabase.from('engagement_letters').select('*').eq('project_id', params.id).maybeSingle(),
    supabase.from('project_assets').select('*, profiles(name)').eq('project_id', params.id).order('created_at', { ascending: false }),
  ])
  const pages = pagesRes.data as Pick<Page, 'id' | 'order_index' | 'template_type' | 'content' | 'status'>[] | null
  const sections = sectionsRes.data as Section[] | null
  const invoices = invoicesRes.data as Invoice[] | null
  const engagementLetter = letterRes.data as EngagementLetter | null
  const initialAssets = assetsRes.data ?? []

  const createdSections = sections?.length ?? 0
  const approvedSections = sections?.filter(s => s.status === 'approved').length ?? 0
  const rejectedSections = sections?.filter(s => s.status === 'rejected').length ?? 0
  const totalSections = project.total_sections ?? createdSections
  const approvalPct = totalSections > 0 ? Math.round((approvedSections / totalSections) * 100) : 0
  const totalPages = pages?.length ?? 0

  const isComplete = approvalPct >= 100 && totalSections > 0

  // Group sections
  const draftSections    = sections?.filter(s => s.status === 'draft') ?? []
  const pendingSections  = sections?.filter(s => s.status === 'pending') ?? []
  const reviewedSections = sections?.filter(s => s.status === 'approved' || s.status === 'rejected') ?? []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
            <Link href="/admin/dashboard" className="hover:text-[#D4AF37] transition-colors">Dashboard</Link>
            <span>/</span>
            <span style={{ color: 'var(--text)' }}>{project.title}</span>
          </div>
          <h1 className="text-3xl font-bold gold-text">{project.title}</h1>
          <div className="mt-2">
            <AssignClientPanel
              projectId={params.id}
              currentClientId={project.client_id ?? null}
              currentClientName={project.profiles?.name ?? null}
              clients={allClients ?? []}
            />
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Link href={`/admin/projects/${params.id}/builder`} className="btn-secondary flex items-center gap-2">
            <Pencil size={15} />
            Open Builder
          </Link>
          {isComplete && (
            <a
              href={`/api/export/${params.id}`}
              target="_blank"
              className="btn-primary flex items-center gap-2"
            >
              <Download size={15} />
              Export PDF
            </a>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pages', value: totalPages, icon: BookOpen, color: 'var(--accent)', bg: 'var(--accent-dim)' },
          { label: 'Sections', value: createdSections, icon: Clock, color: 'var(--text-muted)', bg: 'rgba(42,74,107,0.4)' },
          { label: 'Approved', value: approvedSections, icon: CheckCircle, color: 'var(--success)', bg: 'rgba(45,212,191,0.1)' },
          { label: 'Rejected', value: rejectedSections, icon: XCircle, color: 'var(--danger)', bg: 'rgba(248,113,113,0.1)' },
        ].map(stat => (
          <div key={stat.label} className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{stat.value}</p>
                <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Approval progress */}
      <div className="card-glow">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
          <h2 className="font-bold text-lg" style={{ color: 'var(--accent)' }}>Overall Approval Progress</h2>
          <span className="font-bold text-2xl gold-text">{approvalPct}%</span>
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {approvedSections} of {totalSections} sections approved
            </span>
            <TotalSectionsEditor
              projectId={params.id}
              totalSections={project.total_sections ?? null}
              createdSections={createdSections}
            />
          </div>
          <ProjectStatusUpdater projectId={params.id} currentStatus={project.status} />
        </div>
      </div>

      {/* Project Assets */}
      <ProjectAssets projectId={params.id} initialAssets={initialAssets as any} />

      {/* Sections — grouped */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--accent)' }}>Sections</h2>
          <SectionManager projectId={params.id} pages={pages ?? []} existingSections={sections ?? []} />
        </div>

        {createdSections === 0 ? (
          <div className="card text-center py-10" style={{ color: 'var(--text-muted)' }}>
            No sections yet. Open the Builder, create your pages, then add sections from the Sections tab.
          </div>
        ) : (
          <div className="space-y-6">

            {/* Draft */}
            {draftSections.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                    style={{ color: '#8A9BB8', background: 'rgba(138,155,184,0.12)', border: '1px solid rgba(138,155,184,0.2)' }}>
                    Draft · {draftSections.length}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>not yet sent to client</span>
                </div>
                <div className="space-y-2">
                  {draftSections.map((section: Section) => (
                    <SectionRow key={section.id} section={section} pages={pages ?? []} allSections={sections ?? []} />
                  ))}
                </div>
              </div>
            )}

            {/* Awaiting Review */}
            {pendingSections.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                    style={{ color: '#FBBF24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
                    Awaiting Review · {pendingSections.length}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>sent, waiting on client</span>
                </div>
                <div className="space-y-2">
                  {pendingSections.map((section: Section) => (
                    <SectionRow key={section.id} section={section} pages={pages ?? []} allSections={sections ?? []} />
                  ))}
                </div>
              </div>
            )}

            {/* Reviewed */}
            {reviewedSections.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                    style={{ color: 'var(--success)', background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)' }}>
                    Reviewed · {reviewedSections.length}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>approved or rejected by client</span>
                </div>
                <div className="space-y-2">
                  {reviewedSections.map((section: Section) => (
                    <SectionRow key={section.id} section={section} pages={pages ?? []} allSections={sections ?? []} />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Invoice timeline */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--accent)' }}>Billing Milestones</h2>
        <InvoiceTimeline
          invoices={invoices ?? []}
          totalPrice={project.total_price}
          approvalPct={approvalPct}
        />
      </div>

      {/* Engagement letter — compact, at bottom */}
      <details className="group">
        <summary
          className="flex items-center justify-between cursor-pointer list-none rounded-2xl px-5 py-4 select-none"
          style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent-dim)' }}>
              <FileText size={14} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <span className="font-semibold text-sm" style={{ color: 'var(--accent)' }}>Engagement Letter</span>
              {engagementLetter && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    color: engagementLetter.status === 'accepted' ? 'var(--success)' : engagementLetter.status === 'sent' ? '#FBBF24' : 'var(--text-muted)',
                    background: engagementLetter.status === 'accepted' ? 'rgba(45,212,191,0.1)' : engagementLetter.status === 'sent' ? 'rgba(251,191,36,0.1)' : 'rgba(42,74,107,0.3)',
                  }}>
                  {engagementLetter.status === 'accepted' ? 'Accepted' : engagementLetter.status === 'sent' ? 'Sent' : 'Draft'}
                </span>
              )}
            </div>
          </div>
          <ChevronDown size={16} style={{ color: 'var(--text-muted)' }}
            className="transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-2">
          <EngagementLetterEditor
            projectId={params.id}
            projectTitle={project.title}
            clientName={project.profiles?.name ?? ''}
            clientEmail={project.profiles?.email ?? ''}
            totalPrice={project.total_price}
            initialLetter={engagementLetter}
          />
        </div>
      </details>
    </div>
  )
}
