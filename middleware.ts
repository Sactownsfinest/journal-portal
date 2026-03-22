import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow login and webhooks through first
  if (pathname.startsWith('/login') || pathname.startsWith('/api/webhooks') || pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
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

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    if (pathname === '/') {
      if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      if (role === 'client') {
        const { data: project } = await supabase
          .from('projects').select('id').eq('client_id', user.id)
          .order('created_at', { ascending: false }).limit(1).single()
        if (project) return NextResponse.redirect(new URL(`/client/projects/${project.id}`, request.url))
        return NextResponse.redirect(new URL('/client/no-project', request.url))
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (pathname.startsWith('/client') && role !== 'client') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }

  } catch (e) {
    // On transient errors (network blip, Supabase timeout), pass through —
    // page-level auth will redirect if truly unauthenticated
    return NextResponse.next()
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
