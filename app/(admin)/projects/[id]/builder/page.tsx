import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import JournalBuilder from '@/components/builder/JournalBuilder'
import type { Page } from '@/types'

export default async function BuilderPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, title')
    .eq('id', params.id)
    .single()

  if (!project) notFound()

  const { data: pages } = await supabase
    .from('pages')
    .select('*')
    .eq('project_id', params.id)
    .order('order_index') as { data: Page[] | null }

  return (
    <JournalBuilder
      projectId={params.id}
      projectTitle={project.title}
      initialPages={pages ?? []}
    />
  )
}
