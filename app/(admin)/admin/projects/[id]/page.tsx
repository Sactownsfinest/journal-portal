import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Pencil, CheckCircle, XCircle, Clock, Download } from 'lucide-react'
import InvoiceTimeline from '@/components/billing/InvoiceTimeline'
import ProjectStatusUpdater from '@/components/ProjectStatusUpdater'
import SectionManager from '@/components/approval/SectionManager'
import type { Section, Invoice, Page, Project } from '@/types'

export default async function AdminProjectPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*, profiles(name, email)')
    .eq('id', params.id)
    .single() as { data: (Project & { profiles: { name: string; email: string } }) | null }

  if (!project) notFound()

  const [pagesRes, sectionsRes, invoicesRes] = await Promise.all([
    supabase.from('pages').select('id, order_index, template_type, status').eq('project_id', params.id).order('order_index'),
    supabase.from('sections').select('*').eq('project_id', params.id).order('page_start'),
    supabase.from('invoices').select('*').eq('project_id', params.id).order('milestone'),
  ])
  const pages = pagesRes.data as Pick<Page, 'id' | 'order_index' | 'template_type' | 'status'>[] | null
  const sections = sectionsRes.data as Section[] | null
  const invoices = invoicesRes.data as Invoice[] | null

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
          <div className="flex items-center gap-2 text-[#888] text-sm mb-2">
            <Link href="/admin/dashboard" className="hover:text-[#c8a96e]">Dashboard</Link>
            <span>/</span>
            <span className="text-[#f5f0e8]">{project.title}</span>
          </div>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-[#888] text-sm mt-1">
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
          { label: 'Pages', value: totalPages, icon: BookOpen, color: 'text-[#c8a96e]', bg: 'bg-[#c8a96e]/10' },
          { label: 'Sections', value: totalSections, icon: Clock, color: 'text-[#888]', bg: 'bg-[#333]/50' },
          { label: 'Approved', value: approvedSections, icon: CheckCircle, color: 'text-[#4caf84]', bg: 'bg-[#4caf84]/10' },
          { label: 'Rejected', value: rejectedSections, icon: XCircle, color: 'text-[#e05252]', bg: 'bg-[#e05252]/10' },
        ].map(stat => (
          <div key={stat.label} className="card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-[#888] text-xs">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Approval progress */}
      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Overall Approval Progress</h2>
          <span className="text-[#c8a96e] font-bold text-lg">{approvalPct}%</span>
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
        <div className="flex justify-between mt-2 text-xs text-[#888]">
          <span>{approvedSections} of {totalSections} sections approved</span>
          <ProjectStatusUpdater projectId={params.id} currentStatus={project.status} />
        </div>
      </div>

      {/* Invoice timeline */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Billing Milestones</h2>
        <InvoiceTimeline
          invoices={invoices ?? []}
          totalPrice={project.total_price}
          approvalPct={approvalPct}
        />
      </div>

      {/* Sections */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Sections</h2>
          <SectionManager projectId={params.id} totalPages={totalPages} existingSections={sections ?? []} />
        </div>
        {!sections || sections.length === 0 ? (
          <div className="card text-center py-10 text-[#888]">
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
    pending: { color: 'text-[#888]', bg: 'bg-[#333]/50', label: 'Pending Review' },
    approved: { color: 'text-[#4caf84]', bg: 'bg-[#4caf84]/10', label: 'Approved' },
    rejected: { color: 'text-[#e05252]', bg: 'bg-[#e05252]/10', label: 'Rejected' },
  }
  const s = statusConfig[section.status]

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{section.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
          </div>
          <p className="text-sm text-[#888] mt-0.5">Pages {section.page_start}–{section.page_end}</p>
          {section.client_notes && (
            <p className="text-sm text-[#e8a030] mt-2 bg-[#e8a030]/10 border border-[#e8a030]/20 rounded-lg px-3 py-2">
              Client note: "{section.client_notes}"
            </p>
          )}
        </div>
        {section.reviewed_at && (
          <p className="text-xs text-[#888] shrink-0">
            {new Date(section.reviewed_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  )
}
