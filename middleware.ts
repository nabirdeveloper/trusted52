import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Define protected routes
  const protectedRoutes = [
    '/admin',
    '/admin/dashboard',
    '/admin/analytics',
    '/admin/products',
    '/admin/categories',
    '/admin/orders',
    '/admin/users',
    '/admin/settings',
    '/api/admin',
    '/profile',
    '/checkout',
    '/cart'
    
  ]

  // Define admin-only routes
  const adminOnlyRoutes = [
    '/admin',
    '/api/admin'
  ]

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminOnlyRoute = adminOnlyRoutes.some(route => pathname.startsWith(route))

  // Get the token
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  // Redirect logic for protected routes
  if (isProtectedRoute && !token) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // Check admin-only routes
  if (isAdminOnlyRoute && (!token || token.role !== 'admin')) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/admin-login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (token && (pathname.startsWith('/auth/') || pathname === '/')) {
    if (token.role === 'admin' && pathname.startsWith('/auth/')) {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    } else if (token.role === 'user' && pathname.startsWith('/auth/')) {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Check user activity
  if (token && token.isActive === false) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/blocked'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}