'use client'

import { CheckCircle, ExternalLink } from 'lucide-react'
import type { Invoice } from '@/types'

interface Props {
  approvalPct: number
  approvedSections: number
  totalSections: number
  invoices: Invoice[]
  totalPrice: number
  depositPaid?: boolean
  depositAmount?: number
}

const MILESTONES = [25, 50, 75, 100] as const

export default function JournalProgressBar({
  approvalPct,
  approvedSections,
  totalSections,
  invoices,
  totalPrice,
  depositPaid = false,
  depositAmount = 0,
}: Props) {
  const bookPct = Math.min(Math.max(approvalPct, 0), 100)
  const milestoneAmount = totalPrice > 0
    ? (totalPrice * 0.25).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    : null

  return (
    <div
      className="rounded-2xl px-6 pt-6 pb-7"
      style={{
        background: 'var(--card)',
        border: '1.5px solid rgba(184,131,42,0.18)',
        boxShadow: '0 2px 16px rgba(44,36,22,0.07)',
      }}
    >
      {/* Heading row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-semibold text-lg" style={{ color: 'var(--accent)' }}>Your Journal Progress</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {totalSections > 0
              ? `${approvedSections} of ${totalSections} sections approved`
              : 'Your journal is being crafted — sections coming soon'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Deposit status badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: depositPaid ? 'rgba(74,158,127,0.10)' : 'var(--accent-dim)',
              border: `1px solid ${depositPaid ? 'rgba(74,158,127,0.3)' : 'rgba(184,131,42,0.25)'}`,
              color: depositPaid ? 'var(--success)' : 'var(--accent)',
            }}
          >
            {depositPaid
              ? <><CheckCircle size={11} /> Deposit paid</>
              : <>Deposit pending</>}
            {depositAmount > 0 && ` · $${depositAmount.toLocaleString()}`}
          </div>
          {totalSections > 0 && (
            <span
              className="text-3xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #9A6A10, #C9922A)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {approvalPct}%
            </span>
          )}
        </div>
      </div>

      {/* Bar + book (only when sections exist) */}
      {totalSections > 0 && (
        <div className="relative" style={{ paddingTop: 44, paddingBottom: 72 }}>

          {/* Book icon riding the bar */}
          <div
            className="absolute"
            style={{
              left: `${bookPct}%`,
              top: 0,
              transform: 'translateX(-50%)',
              transition: 'left 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)',
              zIndex: 10,
            }}
          >
            <div style={{ width: 2, height: 12, background: 'rgba(184,131,42,0.25)', margin: '0 auto' }} />
            <div
              className="flex items-center justify-center rounded-xl"
              style={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #B8832A, #D4A84B)',
                boxShadow: '0 4px 14px rgba(184,131,42,0.35), 0 0 0 3px rgba(184,131,42,0.10)',
                animation: approvalPct > 0 && approvalPct < 100 ? 'bookBounce 2s ease-in-out infinite' : 'none',
              }}
            >
              <BookIcon />
            </div>
          </div>

          {/* Progress track */}
          <div
            className="rounded-full overflow-visible relative"
            style={{ height: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${bookPct}%`,
                background: approvalPct >= 100
                  ? 'linear-gradient(90deg, #2DD4BF, #34D399)'
                  : 'linear-gradient(90deg, #B8832A, #9F7EC5)',
                boxShadow: approvalPct > 0 ? '0 0 12px rgba(184,131,42,0.25)' : 'none',
                transition: 'width 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />

            {MILESTONES.map(ms => {
              const inv = invoices.find(i => i.milestone === ms)
              const isPaid = inv?.status === 'paid'
              const isSent = inv?.status === 'sent'
              const isReached = approvalPct >= ms
              return (
                <div key={ms} style={{
                  position: 'absolute', left: `${ms}%`, top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 20, height: 20, borderRadius: '50%',
                  background: isPaid ? 'var(--success)' : isSent ? '#FBBF24' : isReached ? '#B8832A' : 'var(--surface)',
                  border: `2px solid ${isPaid ? 'rgba(74,158,127,0.5)' : isSent ? 'rgba(201,139,10,0.5)' : isReached ? 'rgba(184,131,42,0.35)' : 'var(--border)'}`,
                  boxShadow: isSent && !isPaid ? '0 0 10px rgba(201,139,10,0.5)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 5, transition: 'all 0.5s ease',
                }}>
                  {isPaid && <CheckCircle size={11} color="var(--bg)" strokeWidth={3} />}
                  {isSent && !isPaid && <span style={{ fontSize: 8, fontWeight: 800, color: '#0E1822' }}>$</span>}
                </div>
              )
            })}
          </div>

          {/* Milestone labels */}
          <div className="relative" style={{ marginTop: 8 }}>
            {MILESTONES.map(ms => {
              const inv = invoices.find(i => i.milestone === ms)
              const isPaid = inv?.status === 'paid'
              const isSent = inv?.status === 'sent'
              const isReached = approvalPct >= ms
              const align = ms === 25 ? 'flex-start' : ms === 100 ? 'flex-end' : 'center'
              const translateX = ms === 25 ? '0%' : ms === 100 ? '-100%' : '-50%'
              return (
                <div key={ms} style={{ position: 'absolute', left: `${ms}%`, top: 0, transform: `translateX(${translateX})`, display: 'flex', flexDirection: 'column', alignItems: align, gap: 4 }}>
                  <span className="text-xs font-bold" style={{ color: isPaid ? 'var(--success)' : isSent ? 'var(--warning)' : isReached ? 'var(--accent)' : 'var(--text-muted)' }}>{ms}%</span>
                  {milestoneAmount && <span className="text-xs" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{milestoneAmount}</span>}
                  {isPaid && <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>Paid ✓</span>}
                  {isSent && !isPaid && inv?.hosted_invoice_url && (
                    <a href={inv.hosted_invoice_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold rounded-lg px-2.5 py-1.5"
                      style={{ background: 'rgba(74,158,127,0.10)', color: 'var(--success)', border: '1px solid rgba(74,158,127,0.35)', animation: 'payGlow 2s ease-in-out infinite', whiteSpace: 'nowrap', textDecoration: 'none' }}>
                      <ExternalLink size={10} /> Pay Now
                    </a>
                  )}
                  {isSent && !isPaid && !inv?.hosted_invoice_url && <span className="text-xs font-medium" style={{ color: 'var(--warning)', whiteSpace: 'nowrap' }}>Invoice sent</span>}
                  {!isPaid && !isSent && <span className="text-xs" style={{ color: isReached ? 'var(--warning)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{isReached ? 'Generating…' : 'Upcoming'}</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bookBounce {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50% { transform: translateX(-50%) translateY(-4px); }
        }
        @keyframes payGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(74,158,127,0.25); }
          50% { box-shadow: 0 0 16px rgba(74,158,127,0.5); }
        }
      `}</style>
    </div>
  )
}

function BookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="2" width="2.5" height="16" rx="1" fill="rgba(0,0,0,0.3)" />
      <rect x="5" y="1" width="12" height="18" rx="1.5" fill="rgba(255,255,255,0.25)" />
      <line x1="8" y1="5" x2="14" y2="5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="8" x2="14" y2="8" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinecap="round" />
      <line x1="8" y1="11" x2="12" y2="11" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}
