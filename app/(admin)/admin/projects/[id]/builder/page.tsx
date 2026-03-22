import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import JournalBuilder from '@/components/builder/JournalBuilder'
import type { Page, Section } from '@/types'

export default async function BuilderPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, title')
    .eq('id', params.id)
    .single()

  if (!project) notFound()

  const [pagesRes, sectionsRes] = await Promise.all([
    supabase.from('pages').select('*').eq('project_id', params.id).order('order_index'),
    supabase.from('sections').select('*').eq('project_id', params.id).order('page_start'),
  ])

  return (
    <JournalBuilder
      projectId={params.id}
      projectTitle={project.title}
      initialPages={(pagesRes.data ?? []) as Page[]}
      initialSections={(sectionsRes.data ?? []) as Section[]}
    />
  )
}
