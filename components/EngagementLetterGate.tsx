'use client'

import { useState } from 'react'
import { CheckCircle, FileText, AlertCircle, ScrollText } from 'lucide-react'
import DepositCheckoutButton from '@/components/DepositCheckoutButton'
import type { EngagementLetter } from '@/types'

interface Props {
  letter: EngagementLetter
  projectId: string
  projectTitle: string
  clientName: string
}

export default function EngagementLetterGate({ letter, projectId, projectTitle, clientName }: Props) {
  const router = useRouter()
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState('')

  async function handleAccept() {
    setAccepting(true)
    setError('')

    const res = await fetch('/api/engagement/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ letterId: letter.id, projectId }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      setAccepting(false)
      return
    }

    setAccepted(true)
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-start px-4 py-12">
        <div className="w-full max-w-2xl space-y-6">
          {/* Accepted confirmation */}
          <div
            className="rounded-2xl px-6 py-5 flex items-center gap-4"
            style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.3)' }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.25)' }}
            >
              <CheckCircle size={22} style={{ color: 'var(--success)' }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--success)' }}>Engagement letter accepted!</p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Submit your deposit below to officially kick things off.
              </p>
            </div>
          </div>

          {/* Deposit card */}
          {letter.deposit_amount > 0 && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'linear-gradient(135deg, rgba(30,52,84,0.9), rgba(26,46,69,0.9))' }}
            >
              <div
                className="px-6 py-4"
                style={{ borderBottom: '1px solid rgba(212,175,55,0.15)', background: 'rgba(212,175,55,0.05)' }}
              >
                <p className="font-semibold" style={{ color: 'var(--accent)' }}>Submit Your Deposit</p>
              </div>
              <div className="px-6 py-5 flex items-center justify-between gap-6 flex-wrap">
                <div>
                  <p className="font-medium mb-1">Secure your spot &amp; let&apos;s get to work</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    A deposit of{' '}
                    <span style={{ color: 'var(--accent)' }}>${letter.deposit_amount.toLocaleString()}</span>{' '}
                    is required to begin your journal.
                  </p>
                </div>
                <DepositCheckoutButton
                  projectId={projectId}
                  depositAmount={letter.deposit_amount}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-12">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8 text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--accent-dim)', border: '1px solid rgba(212,175,55,0.25)' }}
        >
          <ScrollText size={24} style={{ color: 'var(--accent)' }} />
        </div>
        <h1 className="text-3xl font-bold gold-text mb-2">Engagement Letter</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Please review and accept the terms below to access your journal portal for{' '}
          <span style={{ color: 'var(--text)' }}>{projectTitle}</span>.
        </p>
      </div>

      {/* Letter content card */}
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden mb-6"
        style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
      >
        {/* Card header */}
        <div
          className="px-6 py-4 flex items-center gap-3"
          style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}
        >
          <FileText size={16} style={{ color: 'var(--accent)' }} />
          <span className="font-semibold">Project Scope &amp; Terms</span>
          <span
            className="ml-auto text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: 'rgba(251,191,36,0.1)', color: 'var(--warning)', border: '1px solid rgba(251,191,36,0.25)' }}
          >
            Awaiting your acceptance
          </span>
        </div>

        {/* Letter body */}
        <div className="px-6 py-6">
          <pre
            className="whitespace-pre-wrap text-sm leading-relaxed"
            style={{ fontFamily: 'Georgia, serif', color: 'var(--text)' }}
          >
            {letter.content}
          </pre>
        </div>

        {/* Deposit callout */}
        {letter.deposit_amount > 0 && (
          <div
            className="mx-6 mb-6 rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: 'var(--accent-dim)', border: '1px solid rgba(212,175,55,0.2)' }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
              Deposit Required to Begin Work
            </span>
            <span className="font-bold text-lg gold-text">
              ${letter.deposit_amount.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className="w-full max-w-2xl flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-4"
          style={{ color: 'var(--danger)', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}
        >
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Accept button */}
      <div className="w-full max-w-2xl space-y-3">
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
        >
          <CheckCircle size={18} />
          {accepting ? 'Accepting…' : 'I Accept — Let\'s Get Started'}
        </button>
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          By clicking above, {clientName}, you agree to the scope and payment terms outlined in this letter.
        </p>
      </div>
    </div>
  )
}
