export type UserRole = 'admin' | 'client'

export interface Profile {
  id: string
  role: UserRole
  name: string
  email: string
}

export type ProjectStatus = 'draft' | 'awaiting_deposit' | 'in_progress' | 'ready_for_review' | 'complete'

export type EngagementStatus = 'draft' | 'sent' | 'accepted'

export interface EngagementLetter {
  id: string
  project_id: string
  content: string
  deposit_amount: number
  status: EngagementStatus
  accepted_at?: string
  accepted_by?: string
  stripe_deposit_invoice_id?: string
  created_at: string
  updated_at: string
}

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

export type ElementType = 'heading' | 'body' | 'image' | 'lines' | 'scripture' | 'prompt'

export interface CanvasElement {
  id: string
  type: ElementType
  // Position as % of canvas dimensions
  x: number
  y: number
  w: number
  h: number
  text?: string
  image_url?: string
  lines_count?: number
  font_family?: string
  font_size?: number
  text_color?: string
  font_weight?: 'normal' | 'bold'
  text_align?: 'left' | 'center' | 'right'
  bg_color?: string
  line_color?: string
  italic?: boolean
}

export interface PageContent {
  // Legacy template fields
  image_url?: string
  title_text?: string
  subtitle_text?: string
  body_text?: string
  prompt_text?: string
  lines_count?: number
  image_side?: 'left' | 'right'
  // Free-form canvas fields
  bg_color?: string
  elements?: CanvasElement[]
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
  hosted_invoice_url?: string
  amount: number
  status: InvoiceStatus
  created_at: string
}
