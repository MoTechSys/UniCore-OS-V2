/**
 * NextAuth Proxy (formerly Middleware)
 * 
 * Protects routes and handles authentication redirects.
 * Uses NextAuth v5 edge-compatible proxy.
 * 
 * @module proxy
 */

import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * Public routes that don't require authentication
 */
const publicRoutes = [
  '/login',
  '/api/auth',
]

/**
 * Routes that should redirect to dashboard if already authenticated
 */
const authRoutes = [
  '/login',
]

/**
 * Check if a path matches any of the given routes
 */
function matchesRoute(path: string, routes: string[]): boolean {
  return routes.some(route => 
    path === route || path.startsWith(`${route}/`)
  )
}

export default auth((req) => {
  const { nextUrl } = req
  const isAuthenticated = !!req.auth
  const path = nextUrl.pathname
  
  // Allow public routes
  if (matchesRoute(path, publicRoutes)) {
    // If authenticated and trying to access auth routes, redirect to dashboard
    if (isAuthenticated && matchesRoute(path, authRoutes)) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }
  
  // Protect all other routes
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', nextUrl)
    loginUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
})

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
