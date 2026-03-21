'use client'

import { useState } from 'react'
import { CreditCard, AlertCircle } from 'lucide-react'

interface Props {
  projectId: string
  depositAmount: number
}

export default function DepositCheckoutButton({ projectId, depositAmount }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePay() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/engagement/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    })

    const data = await res.json()

    if (!res.ok || !data.url) {
      setError(data.error ?? 'Could not start checkout. Please try again.')
      setLoading(false)
      return
    }

    window.location.href = data.url
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handlePay}
        disabled={loading}
        className="btn-primary flex items-center gap-2"
      >
        <CreditCard size={16} />
        {loading ? 'Redirecting to checkout…' : `Submit Deposit — $${depositAmount.toLocaleString()}`}
      </button>
      {error && (
        <div
          className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
          style={{ color: 'var(--danger)', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}
        >
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  )
}
