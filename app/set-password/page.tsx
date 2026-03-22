'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function SetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const strong = password.length >= 8
  const matches = password === confirm && confirm.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!strong) { setError('Password must be at least 8 characters'); return }
    if (!matches) { setError('Passwords do not match'); return }

    setLoading(true)
    const { error: updateErr } = await supabase.auth.updateUser({ password })

    if (updateErr) {
      setError(updateErr.message)
      setLoading(false)
      return
    }

    // Password set — let middleware route them to their portal
    router.push('/')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: "url('/login-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#F5EFE3',
      }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(255,248,235,0.35) 0%, rgba(255,252,245,0.25) 100%)' }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{
              background: 'rgba(255,255,255,0.6)',
              border: '1.5px solid rgba(184,131,42,0.35)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Sparkles size={26} style={{ color: '#B8832A' }} />
          </div>
          <h1 className="text-3xl font-bold mb-1 gold-text">Welcome!</h1>
          <p className="text-sm" style={{ color: '#7A6A50' }}>
            Create a password to access your journal portal
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl px-8 py-8"
          style={{
            background: 'rgba(255,255,255,0.82)',
            border: '1.5px solid rgba(255,255,255,0.95)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 8px 40px rgba(100,70,20,0.12), 0 2px 8px rgba(100,70,20,0.08)',
          }}
        >
          <div>
            <p className="text-sm font-medium mb-4" style={{ color: '#5A4A30' }}>
              Your account is ready. Set a password so you can log back in anytime.
            </p>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="input pr-10"
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {/* Strength hint */}
            {password.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="flex gap-1">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-1 w-8 rounded-full transition-all"
                      style={{ background: password.length >= i * 4 ? '#B8832A' : '#E8E0D0' }} />
                  ))}
                </div>
                <span className="text-xs" style={{ color: strong ? 'var(--success)' : 'var(--text-muted)' }}>
                  {strong ? 'Good' : 'Too short'}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Re-enter your password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
              {matches && (
                <CheckCircle size={15} className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--success)' }} />
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm badge-danger px-4 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary w-full text-base py-3"
            disabled={loading || !strong || !matches}
          >
            {loading ? 'Saving…' : 'Set Password & Enter Portal'}
          </button>
        </form>
      </div>
    </div>
  )
}
