import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, CheckCircle, Clock, Sparkles, Star } from 'lucide-react'
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
      <div
        className="rounded-3xl p-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #FFFBF2 0%, #FFF8ED 50%, #FDFAF5 100%)',
          border: '1.5px solid rgba(184,131,42,0.2)',
          boxShadow: '0 4px 24px rgba(44,36,22,0.07)',
        }}
      >
        <div style={{ position: 'absolute', top: '-40px', right: '-20px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,131,42,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '35%', width: '160px', height: '160px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,107,174,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="relative flex items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star size={13} style={{ color: 'var(--accent)' }} fill="currentColor" />
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>Journal Studio</span>
              <Star size={13} style={{ color: 'var(--accent)' }} fill="currentColor" />
            </div>
            <h1 className="text-4xl font-bold mb-2 gold-text">
              Welcome back, Shennel
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Create beautiful, bespoke 150-page journals for your clients.</p>
          </div>
          <div className="shrink-0"><CreateProjectModal clients={clients ?? []} /></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card-gold">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)', border: '1.5px solid rgba(184,131,42,0.2)' }}>
              <BookOpen size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <span className="text-4xl font-bold gold-text">{totalProjects}</span>
          </div>
          <p className="font-semibold" style={{ color: 'var(--text)' }}>Total Projects</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>All journals created</p>
        </div>
        <div className="stat-card-violet">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--violet-dim)', border: '1.5px solid rgba(139,107,174,0.2)' }}>
              <Clock size={20} style={{ color: 'var(--violet)' }} />
            </div>
            <span className="text-4xl font-bold" style={{ color: 'var(--violet)' }}>{activeProjects}</span>
          </div>
          <p className="font-semibold" style={{ color: 'var(--text)' }}>In Progress</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Currently active</p>
        </div>
        <div className="stat-card-teal">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(74,158,127,0.10)', border: '1.5px solid rgba(74,158,127,0.2)' }}>
              <CheckCircle size={20} style={{ color: 'var(--success)' }} />
            </div>
            <span className="text-4xl font-bold" style={{ color: 'var(--success)' }}>{completeProjects}</span>
          </div>
          <p className="font-semibold" style={{ color: 'var(--text)' }}>Completed</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Delivered to clients</p>
        </div>
      </div>

      <div className="divider-gold" />

      <div>
        <h2 className="section-heading mb-5">All Projects</h2>
        {!projects || projects.length === 0 ? (
          <div className="rounded-3xl p-16 text-center" style={{ background: 'linear-gradient(135deg, #FFFBF5, #FFF8EE)', border: '1.5px dashed rgba(184,131,42,0.3)' }}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--accent-dim)', border: '1px solid rgba(212,175,55,0.25)' }}>
              <Sparkles size={32} style={{ color: 'var(--accent)' }} />
            </div>
            <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>No projects yet</p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Create your first bespoke journal to get started</p>
            <CreateProjectModal clients={clients ?? []} />
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map(project => (<ProjectCard key={project.id} project={project} />))}
          </div>
        )}
      </div>
    </div>
  )
}

async function ProjectCard({ project }: { project: Project & { profiles: { name: string; email: string } } }) {
  const supabase = await createClient()
  const { data: sections } = await supabase.from('sections').select('status').eq('project_id', project.id) as { data: Pick<Section, 'status'>[] | null }
  const { data: invoices } = await supabase.from('invoices').select('status, amount, milestone').eq('project_id', project.id) as { data: Pick<Invoice, 'status' | 'amount' | 'milestone'>[] | null }

  const totalSections = sections?.length ?? 0
  const approvedSections = sections?.filter(s => s.status === 'approved').length ?? 0
  const approvalPct = totalSections > 0 ? Math.round((approvedSections / totalSections) * 100) : 0
  const paidAmount = invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0) ?? 0

  const statusBadge: Record<string, string> = { draft: 'badge-gold', awaiting_deposit: 'badge-gold', in_progress: 'badge-violet', ready_for_review: 'badge-gold', complete: 'badge-success' }
  const statusLabel: Record<string, string> = { draft: 'Draft', awaiting_deposit: 'Awaiting Deposit', in_progress: 'In Progress', ready_for_review: 'Ready for Review', complete: 'Complete' }
  const accentColor = project.status === 'complete' ? 'var(--success)' : (project.status === 'in_progress' || project.status === 'ready_for_review') ? 'var(--violet-light)' : 'var(--accent)'

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--card)', border: '1.5px solid var(--border)', boxShadow: '0 2px 12px rgba(44,36,22,0.06)' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-7 rounded-full shrink-0" style={{ background: accentColor }} />
            <h3 className="font-bold text-lg truncate" style={{ color: 'var(--text)' }}>{project.title}</h3>
            <span className={statusBadge[project.status] ?? 'badge-gold'}>{statusLabel[project.status] ?? project.status}</span>
          </div>
          <p className="text-sm ml-4" style={{ color: 'var(--text-muted)' }}>
            Client: <span style={{ color: 'var(--text)' }}>{project.profiles?.name ?? 'Unassigned'}</span>
          </p>
          {totalSections > 0 && (
            <div className="mt-4 ml-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span style={{ color: 'var(--text-muted)' }}>Approval progress</span>
                <span style={{ color: 'var(--accent)' }}>{approvedSections}/{totalSections} · {approvalPct}%</span>
              </div>
              <div className="progress-bar h-2.5"><div className="progress-fill" style={{ width: `${approvalPct}%` }} /></div>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Total</p>
            <p className="font-bold text-xl gold-text">
              ${project.total_price.toLocaleString()}
            </p>
            {paidAmount > 0 && <p className="text-xs mt-0.5" style={{ color: 'var(--success)' }}>${paidAmount.toLocaleString()} paid</p>}
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/projects/${project.id}/builder`} className="btn-secondary text-xs px-3 py-1.5">Builder</Link>
            <Link href={`/admin/projects/${project.id}`} className="btn-primary text-xs px-3 py-1.5">Overview</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
