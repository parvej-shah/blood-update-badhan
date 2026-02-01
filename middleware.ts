import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/register',
    '/api/auth',
  ]

  // Public API routes (specific methods)
  const isPublicApiRoute = 
    pathname === '/api/users' && request.method === 'POST' // Registration

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route)) || isPublicApiRoute

  // Admin-only routes
  const adminRoutes = ['/admin']

  // Moderator or admin routes
  const moderatorRoutes = ['/training']

  // Get token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // If accessing a public route, allow
  if (isPublicRoute) {
    // Redirect to home if already logged in and trying to access login/register
    if ((pathname === '/login' || pathname === '/register') && token) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // If not authenticated and trying to access protected route
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check admin routes
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    const roles = (token.roles as string[]) || []
    if (!roles.includes('admin')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Check moderator routes
  if (moderatorRoutes.some((route) => pathname.startsWith(route))) {
    const roles = (token.roles as string[]) || []
    if (!roles.includes('moderator') && !roles.includes('admin')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

