import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, BookOpen, CheckCircle, Clock, DollarSign } from 'lucide-react'
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

  // Aggregate stats
  const totalProjects = projects?.length ?? 0
  const activeProjects = projects?.filter(p => p.status === 'in_progress' || p.status === 'ready_for_review').length ?? 0
  const completeProjects = projects?.filter(p => p.status === 'complete').length ?? 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f5f0e8]">Dashboard</h1>
          <p className="text-[#888] text-sm mt-1">Manage your journal projects</p>
        </div>
        <CreateProjectModal clients={clients ?? []} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#c8a96e]/10 flex items-center justify-center">
              <BookOpen size={18} className="text-[#c8a96e]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalProjects}</p>
              <p className="text-[#888] text-xs">Total Projects</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8a030]/10 flex items-center justify-center">
              <Clock size={18} className="text-[#e8a030]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeProjects}</p>
              <p className="text-[#888] text-xs">In Progress</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#4caf84]/10 flex items-center justify-center">
              <CheckCircle size={18} className="text-[#4caf84]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completeProjects}</p>
              <p className="text-[#888] text-xs">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects list */}
      <div>
        <h2 className="text-lg font-semibold mb-4">All Projects</h2>
        {!projects || projects.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen size={40} className="mx-auto text-[#333] mb-4" />
            <p className="text-[#888]">No projects yet. Create your first one!</p>
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

  const statusColors: Record<string, string> = {
    draft: 'text-[#888] bg-[#333]/50',
    in_progress: 'text-[#e8a030] bg-[#e8a030]/10',
    ready_for_review: 'text-[#c8a96e] bg-[#c8a96e]/10',
    complete: 'text-[#4caf84] bg-[#4caf84]/10',
  }

  return (
    <div className="card hover:border-[#c8a96e]/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-[#f5f0e8] truncate">{project.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[project.status]}`}>
              {project.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-[#888]">Client: {project.profiles?.name ?? 'Unassigned'}</p>

          {/* Approval progress bar */}
          {totalSections > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-[#888] mb-1">
                <span>Approval progress</span>
                <span>{approvedSections}/{totalSections} sections ({approvalPct}%)</span>
              </div>
              <div className="h-1.5 bg-[#333] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#c8a96e] rounded-full transition-all duration-500"
                  style={{ width: `${approvalPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="text-right">
            <p className="text-sm text-[#888]">Total</p>
            <p className="font-semibold text-[#c8a96e]">${project.total_price.toLocaleString()}</p>
          </div>
          {paidAmount > 0 && (
            <p className="text-xs text-[#4caf84]">${paidAmount.toLocaleString()} paid</p>
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
