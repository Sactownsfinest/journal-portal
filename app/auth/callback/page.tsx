'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    async function handleAuth() {
      const supabase = createClient()

      const params = new URLSearchParams(window.location.search)
      const hash = window.location.hash.slice(1)
      const hashParams = new URLSearchParams(hash)

      const code = params.get('code')
      const errorDesc = hashParams.get('error_description') || params.get('error')
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type') || params.get('type')

      if (errorDesc) {
        router.replace('/login?error=invite_expired')
        return
      }

      if (code) {
        // PKCE flow — exchange code for session
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          router.replace('/login?error=invite_expired')
          return
        }
      } else if (accessToken) {
        // Implicit / hash flow — Supabase client picks it up automatically
        await supabase.auth.getSession()
      } else {
        router.replace('/login?error=invite_expired')
        return
      }

      // Invite links → force them to set a password before continuing
      if (type === 'invite') {
        router.replace('/set-password')
      } else {
        router.replace('/')
      }
    }

    handleAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--accent-dim)', border: '1px solid rgba(184,131,42,0.2)' }}
        >
          <div
            className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          Setting up your account…
        </p>
      </div>
    </div>
  )
}
