import type { Invoice } from '@/types'
import { CheckCircle, Clock, Send, DollarSign } from 'lucide-react'

interface Props {
  invoices: Invoice[]
  totalPrice: number
  approvalPct: number
}

const MILESTONES = [25, 50, 75, 100] as const

export default function InvoiceTimeline({ invoices, totalPrice, approvalPct }: Props) {
  const milestoneAmount = totalPrice * 0.25

  return (
    <div className="grid grid-cols-4 gap-3">
      {MILESTONES.map(milestone => {
        const invoice = invoices.find(i => i.milestone === milestone)
        const isReached = approvalPct >= milestone
        const status = invoice?.status

        let borderColor = 'var(--border)'
        let bgColor = 'transparent'
        let label = 'Not reached'
        let labelColor = 'var(--text-muted)'
        let icon = <Clock size={16} style={{ color: 'var(--text-muted)' }} />

        if (status === 'paid') {
          icon = <CheckCircle size={16} style={{ color: 'var(--success)' }} />
          borderColor = 'rgba(45,212,191,0.4)'
          bgColor = 'rgba(45,212,191,0.06)'
          label = 'Paid ✓'
          labelColor = 'var(--success)'
        } else if (status === 'sent') {
          icon = <Send size={16} style={{ color: 'var(--warning)' }} />
          borderColor = 'rgba(251,191,36,0.4)'
          bgColor = 'rgba(251,191,36,0.06)'
          label = 'Invoice sent'
          labelColor = 'var(--warning)'
        } else if (isReached) {
          icon = <DollarSign size={16} style={{ color: 'var(--accent)' }} />
          borderColor = 'rgba(212,175,55,0.4)'
          bgColor = 'var(--accent-dim)'
          label = 'Processing…'
          labelColor = 'var(--accent)'
        }

        return (
          <div
            key={milestone}
            className="rounded-xl p-4 transition-all"
            style={{ border: `1px solid ${borderColor}`, background: bgColor }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold gold-text">{milestone}%</span>
              {icon}
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
              ${milestoneAmount.toFixed(0)}
            </p>
            <p className="text-xs mt-1" style={{ color: labelColor }}>{label}</p>
            {invoice?.created_at && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {new Date(invoice.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
