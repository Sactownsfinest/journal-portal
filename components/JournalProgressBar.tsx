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

// CSS book illustration
function BookIcon({ size = 40 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size * 1.25,
        position: 'relative',
        filter: 'drop-shadow(0 4px 8px rgba(184,131,42,0.4))',
      }}
    >
      {/* Book spine */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 2,
        bottom: 2,
        width: size * 0.18,
        background: 'linear-gradient(180deg, #8A5E0A, #6B4808)',
        borderRadius: '3px 0 0 3px',
      }} />
      {/* Book cover */}
      <div style={{
        position: 'absolute',
        left: size * 0.18,
        top: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #C9922A, #B8832A, #9A6A10)',
        borderRadius: '0 3px 3px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
      }}>
        {/* Decorative lines on cover */}
        <div style={{ width: '55%', height: 1.5, background: 'rgba(255,255,255,0.35)', borderRadius: 1 }} />
        <div style={{ width: '40%', height: 1, background: 'rgba(255,255,255,0.2)', borderRadius: 1 }} />
        <div style={{ width: '55%', height: 1.5, background: 'rgba(255,255,255,0.35)', borderRadius: 1 }} />
      </div>
      {/* Pages edge */}
      <div style={{
        position: 'absolute',
        right: -3,
        top: 3,
        bottom: 3,
        width: 4,
        background: 'linear-gradient(90deg, #F5EDD6, #EDE0C0)',
        borderRadius: '0 2px 2px 0',
      }} />
    </div>
  )
}

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
            {totalSections > 0 ? `${approvedSections} of ${totalSections} sections approved` : 'Work in progress — sections coming soon'}
          </p>
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

      {/* Progress bar with book */}
      {totalSections > 0 && (
        <div className="relative" style={{ paddingTop: 52, paddingBottom: 64 }}>
          {/* Book riding the bar */}
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
            <div style={{ width: 2, height: 10, background: 'rgba(184,131,42,0.3)', margin: '0 auto' }} />
            <div style={{
              animation: approvalPct > 0 && approvalPct < 100 ? 'bookBounce 2s ease-in-out infinite' : 'none',
              display: 'flex',
              justifyContent: 'center',
            }}>
              <BookIcon size={32} />
            </div>
          </div>

          {/* Track */}
          <div className="rounded-full overflow-visible relative" style={{ height: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${bookPct}%`,
                background: approvalPct >= 100 ? 'linear-gradient(90deg, #2DD4BF, #34D399)' : 'linear-gradient(90deg, #B8832A, #9F7EC5)',
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
                  width: 18, height: 18, borderRadius: '50%',
                  background: isPaid ? 'var(--success)' : isSent ? '#FBBF24' : isReached ? '#B8832A' : 'var(--surface)',
                  border: `2px solid ${isPaid ? 'rgba(74,158,127,0.5)' : isSent ? 'rgba(201,139,10,0.5)' : isReached ? 'rgba(184,131,42,0.35)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5,
                  transition: 'all 0.5s ease',
                }}>
                  {isPaid && <CheckCircle size={10} color="var(--bg)" strokeWidth={3} />}
                  {isSent && !isPaid && <span style={{ fontSize: 7, fontWeight: 800, color: '#0E1822' }}>$</span>}
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
                <div key={ms} style={{ position: 'absolute', left: `${ms}%`, top: 0, transform: `translateX(${translateX})`, display: 'flex', flexDirection: 'column', alignItems: align, gap: 3 }}>
                  <span className="text-xs font-bold" style={{ color: isPaid ? 'var(--success)' : isSent ? 'var(--warning)' : isReached ? 'var(--accent)' : 'var(--text-muted)' }}>{ms}%</span>
                  {milestoneAmount && <span className="text-xs" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{milestoneAmount}</span>}
                  {isPaid && <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>Paid ✓</span>}
                  {isSent && !isPaid && inv?.hosted_invoice_url && (
                    <a href={inv.hosted_invoice_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold rounded-lg px-2.5 py-1.5 transition-all"
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

      {/* Deposit + milestone payment summary */}
      <div className="mt-4 flex flex-wrap gap-2">
        {/* Deposit badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
          style={{
            background: depositPaid ? 'rgba(74,158,127,0.08)' : 'var(--accent-dim)',
            border: `1px solid ${depositPaid ? 'rgba(74,158,127,0.3)' : 'rgba(184,131,42,0.25)'}`,
            color: depositPaid ? 'var(--success)' : 'var(--accent)',
          }}>
          {depositPaid ? <CheckCircle size={12} /> : <span style={{ fontSize: 11 }}>●</span>}
          Deposit {depositAmount > 0 ? `($${depositAmount.toLocaleString()})` : ''} — {depositPaid ? 'Paid ✓' : 'Pending'}
        </div>

        {/* Milestone payment badges */}
        {MILESTONES.map(ms => {
          const inv = invoices.find(i => i.milestone === ms)
          const isPaid = inv?.status === 'paid'
          const isSent = inv?.status === 'sent'
          return (
            <div key={ms} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
              style={{
                background: isPaid ? 'rgba(74,158,127,0.08)' : isSent ? 'rgba(251,191,36,0.08)' : 'rgba(44,36,22,0.04)',
                border: `1px solid ${isPaid ? 'rgba(74,158,127,0.3)' : isSent ? 'rgba(251,191,36,0.3)' : 'var(--border)'}`,
                color: isPaid ? 'var(--success)' : isSent ? 'var(--warning)' : 'var(--text-muted)',
              }}>
              {isPaid ? <CheckCircle size={12} /> : <span style={{ fontSize: 11 }}>○</span>}
              {ms}% milestone — {isPaid ? 'Paid ✓' : isSent ? 'Invoice sent' : 'Upcoming'}
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes bookBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes payGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(74,158,127,0.25); }
          50% { box-shadow: 0 0 16px rgba(74,158,127,0.5); }
        }
      `}</style>
    </div>
  )
}
