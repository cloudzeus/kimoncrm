import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Skip middleware for API routes, static files, and auth pages
  if (
    nextUrl.pathname.startsWith('/api') ||
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/static') ||
    nextUrl.pathname.includes('.') ||
    nextUrl.pathname.startsWith('/sign-in') ||
    nextUrl.pathname.startsWith('/sign-up') ||
    nextUrl.pathname.startsWith('/public')
  ) {
    return NextResponse.next()
  }

  // Redirect to sign-in if not authenticated
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/sign-in', nextUrl))
  }

  // Role-based access control
  const userRole = req.auth?.user?.role || "USER"
  
  // Admin-only routes
  if (nextUrl.pathname.startsWith('/settings') && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // Manager+ routes
  if (
    (nextUrl.pathname.startsWith('/companies') ||
     nextUrl.pathname.startsWith('/contacts') ||
     nextUrl.pathname.startsWith('/leads') ||
     nextUrl.pathname.startsWith('/opportunities')) &&
    !['ADMIN', 'MANAGER'].includes(userRole)
  ) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // B2B portal routes
  if (nextUrl.pathname.startsWith('/b2b') && userRole !== 'B2B') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}