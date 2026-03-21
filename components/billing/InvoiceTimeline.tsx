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

        let icon = <Clock size={16} className="text-[#555]" />
        let borderColor = 'border-[#333]'
        let bgColor = 'bg-transparent'
        let label = 'Not reached'
        let labelColor = 'text-[#555]'

        if (status === 'paid') {
          icon = <CheckCircle size={16} className="text-[#4caf84]" />
          borderColor = 'border-[#4caf84]/40'
          bgColor = 'bg-[#4caf84]/5'
          label = 'Paid'
          labelColor = 'text-[#4caf84]'
        } else if (status === 'sent') {
          icon = <Send size={16} className="text-[#e8a030]" />
          borderColor = 'border-[#e8a030]/40'
          bgColor = 'bg-[#e8a030]/5'
          label = 'Invoice sent'
          labelColor = 'text-[#e8a030]'
        } else if (isReached) {
          icon = <DollarSign size={16} className="text-[#c8a96e]" />
          borderColor = 'border-[#c8a96e]/40'
          bgColor = 'bg-[#c8a96e]/5'
          label = 'Processing…'
          labelColor = 'text-[#c8a96e]'
        }

        return (
          <div key={milestone} className={`rounded-xl border ${borderColor} ${bgColor} p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl font-bold text-[#f5f0e8]">{milestone}%</span>
              {icon}
            </div>
            <p className="text-sm font-semibold text-[#c8a96e]">${milestoneAmount.toFixed(0)}</p>
            <p className={`text-xs mt-1 ${labelColor}`}>{label}</p>
            {invoice?.created_at && (
              <p className="text-xs text-[#555] mt-1">
                {new Date(invoice.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
