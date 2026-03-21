import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Allow public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/api/webhooks')) {
    if (user && pathname === '/login') {
      // Redirect logged-in users away from login
      return redirectByRole(supabase, user.id, request)
    }
    return supabaseResponse
  }

  // Require auth for everything else
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Fetch role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role

  // Guard admin routes
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Guard client routes
  if (pathname.startsWith('/client') && role !== 'client') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // Root redirect
  if (pathname === '/') {
    if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    if (role === 'client') {
      // Find their project and redirect
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (project) return NextResponse.redirect(new URL(`/client/projects/${project.id}`, request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

async function redirectByRole(supabase: ReturnType<typeof createServerClient>, userId: string, request: NextRequest) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profile?.role === 'admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('client_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (project) {
    return NextResponse.redirect(new URL(`/client/projects/${project.id}`, request.url))
  }

  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
