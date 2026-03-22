'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'invite_expired') {
      setError('Your invite link has expired. Please ask Shennel to resend it.')
    }

    // Supabase sometimes lands here with the invite token in the hash — forward to callback
    const hash = window.location.hash
    if (hash && hash.includes('type=invite') && hash.includes('access_token=')) {
      router.replace(`/auth/callback${hash}`)
    }
  }, [router])

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
      router.push(project ? `/client/projects/${project.id}` : '/client/no-project')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: "url('/login-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        /* CSS fallback if no image is provided */
        backgroundColor: '#F5EFE3',
      }}
    >
      {/* Soft overlay to ensure readability */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(255,248,235,0.35) 0%, rgba(255,252,245,0.25) 100%)',
        }}
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
          <h1 className="text-3xl font-bold mb-1 gold-text">
            Journal Portal
          </h1>
          <p className="text-sm" style={{ color: '#7A6A50' }}>Your custom journal workspace</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleLogin}
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
            <p className="text-sm badge-danger px-4 py-2 rounded-lg">{error}</p>
          )}

          <button type="submit" className="btn-primary w-full text-base py-3" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
