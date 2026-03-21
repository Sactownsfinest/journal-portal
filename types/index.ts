export type UserRole = 'admin' | 'client'

export interface Profile {
  id: string
  role: UserRole
  name: string
  email: string
}

export type ProjectStatus = 'draft' | 'in_progress' | 'ready_for_review' | 'complete'

export interface Project {
  id: string
  title: string
  client_id: string
  total_price: number
  status: ProjectStatus
  created_at: string
  profiles?: Profile
}

export type TemplateType = 'cover' | 'full_image' | 'text_image' | 'prompt_lines' | 'blank'

export type PageStatus = 'draft' | 'pending_review' | 'approved' | 'rejected'

export interface PageContent {
  image_url?: string
  title_text?: string
  subtitle_text?: string
  body_text?: string
  prompt_text?: string
  lines_count?: number
  image_side?: 'left' | 'right'
}

export interface Page {
  id: string
  project_id: string
  order_index: number
  template_type: TemplateType
  content: PageContent
  status: PageStatus
  rejection_notes?: string
  reviewed_at?: string
}

export type SectionStatus = 'pending' | 'approved' | 'rejected'

export interface Section {
  id: string
  project_id: string
  name: string
  page_start: number
  page_end: number
  status: SectionStatus
  client_notes?: string
  reviewed_at?: string
}

export type InvoiceStatus = 'pending' | 'sent' | 'paid'

export interface Invoice {
  id: string
  project_id: string
  milestone: 25 | 50 | 75 | 100
  stripe_invoice_id?: string
  stripe_customer_id?: string
  amount: number
  status: InvoiceStatus
  created_at: string
}
