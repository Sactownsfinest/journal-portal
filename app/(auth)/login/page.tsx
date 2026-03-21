'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !data.user) {
      setError(authError?.message ?? 'Login failed')
      setLoading(false)
      return
    }

    // Fetch role and redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role === 'admin') {
      router.push('/admin/dashboard')
    } else {
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', data.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      router.push(project ? `/client/projects/${project.id}` : '/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background glow effect */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div
            className="inline-flex w-20 h-20 rounded-full items-center justify-center mb-5"
            style={{
              background: 'var(--accent-dim)',
              border: '1px solid rgba(212,175,55,0.3)',
              boxShadow: '0 0 40px rgba(212,175,55,0.15)',
            }}
          >
            <Sparkles size={32} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-3xl font-bold gold-text mb-1">Journal Portal</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Your custom journal workspace</p>
        </div>

        <form onSubmit={handleLogin} className="card-glow space-y-5">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm badge-danger px-4 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full text-base py-3" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
