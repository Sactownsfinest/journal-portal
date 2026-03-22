import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Pencil, CheckCircle, XCircle, Clock, Download } from 'lucide-react'
import InvoiceTimeline from '@/components/billing/InvoiceTimeline'
import ProjectStatusUpdater from '@/components/ProjectStatusUpdater'
import SectionManager from '@/components/approval/SectionManager'
import EngagementLetterEditor from '@/components/EngagementLetterEditor'
import ProjectAssets from '@/components/ProjectAssets'
import type { Section, Invoice, Page, Project, EngagementLetter } from '@/types'

export default async function AdminProjectPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*, profiles(name, email)')
    .eq('id', params.id)
    .single() as { data: (Project & { profiles: { name: string; email: string } }) | null }

  if (!project) notFound()

  const [pagesRes, sectionsRes, invoicesRes, letterRes, assetsRes] = await Promise.all([
    supabase.from('pages').select('id, order_index, template_type, status').eq('project_id', params.id).order('order_index'),
    supabase.from('sections').select('*').eq('project_id', params.id).order('page_start'),
    supabase.from('invoices').select('*').eq('project_id', params.id).order('milestone'),
    supabase.from('engagement_letters').select('*').eq('project_id', params.id).maybeSingle(),
    supabase.from('project_assets').select('*, profiles(name)').eq('project_id', params.id).order('created_at', { ascending: false }),
  ])
  const pages = pagesRes.data as Pick<Page, 'id' | 'order_index' | 'template_type' | 'status'>[] | null
  const sections = sectionsRes.data as Section[] | null
  const invoices = invoicesRes.data as Invoice[] | null
  const engagementLetter = letterRes.data as EngagementLetter | null
  const initialAssets = assetsRes.data ?? []

  const totalSections = sections?.length ?? 0
  const approvedSections = sections?.filter(s => s.status === 'approved').length ?? 0
  const rejectedSections = sections?.filter(s => s.status === 'rejected').length ?? 0
  const approvalPct = totalSections > 0 ? Math.round((approvedSections / totalSections) * 100) : 0
  const totalPages = pages?.length ?? 0

  const isComplete = approvalPct >= 100 && totalSections > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
            <Link href="/admin/dashboard" className="hover:text-[#D4AF37] transition-colors">Dashboard</Link>
            <span>/</span>
            <span style={{ color: 'var(--text)' }}>{project.title}</span>
          </div>
          <h1 className="text-3xl font-bold gold-text">{project.title}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Client: {project.profiles?.name ?? 'Unassigned'} {project.profiles?.email ? `(${project.profiles.email})` : ''}
          </p>
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
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Pages', value: totalPages, icon: BookOpen, color: 'var(--accent)', bg: 'var(--accent-dim)' },
          { label: 'Sections', value: totalSections, icon: Clock, color: 'var(--text-muted)', bg: 'rgba(42,74,107,0.4)' },
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
        <div className="flex justify-between items-center mb-3">
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
        <div className="flex justify-between mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{approvedSections} of {totalSections} sections approved</span>
          <ProjectStatusUpdater projectId={params.id} currentStatus={project.status} />
        </div>
      </div>

      {/* Engagement letter */}
      <EngagementLetterEditor
        projectId={params.id}
        projectTitle={project.title}
        clientName={project.profiles?.name ?? ''}
        clientEmail={project.profiles?.email ?? ''}
        totalPrice={project.total_price}
        initialLetter={engagementLetter}
      />

      {/* Project Assets */}
      <ProjectAssets projectId={params.id} initialAssets={initialAssets as any} />

      {/* Invoice timeline */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--accent)' }}>Billing Milestones</h2>
        <InvoiceTimeline
          invoices={invoices ?? []}
          totalPrice={project.total_price}
          approvalPct={approvalPct}
        />
      </div>

      {/* Sections */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--accent)' }}>Sections</h2>
          <SectionManager projectId={params.id} totalPages={totalPages} existingSections={sections ?? []} />
        </div>
        {!sections || sections.length === 0 ? (
          <div className="card text-center py-10" style={{ color: 'var(--text-muted)' }}>
            No sections yet. Add pages in the builder, then create sections to send for client review.
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map(section => (
              <SectionRow key={section.id} section={section} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SectionRow({ section }: { section: Section }) {
  const statusConfig = {
    pending: { color: 'var(--text-muted)', bg: 'rgba(42,74,107,0.4)', label: 'Pending Review', badgeClass: '' },
    approved: { color: 'var(--success)', bg: 'rgba(45,212,191,0.1)', label: 'Approved', badgeClass: 'badge-success' },
    rejected: { color: 'var(--danger)', bg: 'rgba(248,113,113,0.1)', label: 'Rejected', badgeClass: 'badge-danger' },
  }
  const s = statusConfig[section.status]

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{section.name}</h3>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ color: s.color, background: s.bg }}
            >
              {s.label}
            </span>
          </div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Pages {section.page_start}–{section.page_end}
          </p>
          {section.client_notes && (
            <p
              className="text-sm mt-2 rounded-lg px-3 py-2"
              style={{
                color: 'var(--warning)',
                background: 'rgba(251,191,36,0.08)',
                border: '1px solid rgba(251,191,36,0.2)',
              }}
            >
              Client note: &ldquo;{section.client_notes}&rdquo;
            </p>
          )}
        </div>
        {section.reviewed_at && (
          <p className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
            {new Date(section.reviewed_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  )
}
