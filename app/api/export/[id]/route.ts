import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import JournalDocument from '@/lib/pdf/JournalDocument'
import type { Page } from '@/types'
import React from 'react'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Auth check — admin only
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Fetch project + pages
  const { data: project } = await supabase.from('projects').select('title').eq('id', params.id).single()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: pages } = await supabase
    .from('pages')
    .select('*')
    .eq('project_id', params.id)
    .order('order_index') as { data: Page[] | null }

  if (!pages || pages.length === 0) {
    return NextResponse.json({ error: 'No pages to export' }, { status: 400 })
  }

  const buffer = await renderToBuffer(
    React.createElement(JournalDocument, { pages, title: project.title })
  )

  const filename = `${project.title.replace(/[^a-z0-9]/gi, '_')}_print.pdf`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    },
  })
}
