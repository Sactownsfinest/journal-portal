import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, CheckCircle, Clock } from 'lucide-react'
import CreateProjectModal from '@/components/CreateProjectModal'
import type { Project, Invoice, Section } from '@/types'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('*, profiles(name, email)')
    .order('created_at', { ascending: false }) as { data: (Project & { profiles: { name: string; email: string } })[] | null }

  const { data: clients } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('role', 'client')
    .order('name')

  const totalProjects = projects?.length ?? 0
  const activeProjects = projects?.filter(p => p.status === 'in_progress' || p.status === 'ready_for_review').length ?? 0
  const completeProjects = projects?.filter(p => p.status === 'complete').length ?? 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gold-text">Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage your journal projects</p>
        </div>
        <CreateProjectModal clients={clients ?? []} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-glow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
              <BookOpen size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="text-3xl font-bold">{totalProjects}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Projects</p>
            </div>
          </div>
        </div>
        <div className="card-glow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--violet-dim)' }}>
              <Clock size={20} style={{ color: 'var(--violet-light)' }} />
            </div>
            <div>
              <p className="text-3xl font-bold">{activeProjects}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>In Progress</p>
            </div>
          </div>
        </div>
        <div className="card-glow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(45,212,191,0.1)' }}>
              <CheckCircle size={20} style={{ color: 'var(--success)' }} />
            </div>
            <div>
              <p className="text-3xl font-bold">{completeProjects}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects list */}
      <div>
        <h2 className="text-lg font-semibold mb-4">All Projects</h2>
        {!projects || projects.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen size={40} className="mx-auto mb-4" style={{ color: 'var(--border)' }} />
            <p style={{ color: 'var(--text-muted)' }}>No projects yet. Create your first one!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

async function ProjectCard({ project }: { project: Project & { profiles: { name: string; email: string } } }) {
  const supabase = await createClient()

  const { data: sections } = await supabase
    .from('sections')
    .select('status')
    .eq('project_id', project.id) as { data: Pick<Section, 'status'>[] | null }

  const { data: invoices } = await supabase
    .from('invoices')
    .select('status, amount, milestone')
    .eq('project_id', project.id) as { data: Pick<Invoice, 'status' | 'amount' | 'milestone'>[] | null }

  const totalSections = sections?.length ?? 0
  const approvedSections = sections?.filter(s => s.status === 'approved').length ?? 0
  const approvalPct = totalSections > 0 ? Math.round((approvedSections / totalSections) * 100) : 0
  const paidAmount = invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0) ?? 0

  const statusBadge: Record<string, { text: string; class: string }> = {
    draft: { text: 'Draft', class: 'badge-gold' },
    in_progress: { text: 'In Progress', class: 'badge-violet' },
    ready_for_review: { text: 'Ready for Review', class: 'badge-gold' },
    complete: { text: 'Complete', class: 'badge-success' },
  }
  const badge = statusBadge[project.status] ?? { text: project.status, class: 'badge-gold' }

  return (
    <div
      className="card transition-all duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: '0 0 0 0 transparent' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 24px rgba(212,175,55,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 0 0 transparent')}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold truncate" style={{ color: 'var(--text)' }}>{project.title}</h3>
            <span className={badge.class}>{badge.text}</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Client: {project.profiles?.name ?? 'Unassigned'}
          </p>

          {totalSections > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                <span>Approval progress</span>
                <span>{approvedSections}/{totalSections} sections ({approvalPct}%)</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${approvalPct}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total</p>
            <p className="font-bold text-lg gold-text">${project.total_price.toLocaleString()}</p>
          </div>
          {paidAmount > 0 && (
            <p className="text-xs" style={{ color: 'var(--success)' }}>${paidAmount.toLocaleString()} paid</p>
          )}
          <div className="flex gap-2 mt-1">
            <Link href={`/admin/projects/${project.id}/builder`} className="btn-secondary text-xs px-3 py-1.5">
              Builder
            </Link>
            <Link href={`/admin/projects/${project.id}`} className="btn-primary text-xs px-3 py-1.5">
              Overview
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
