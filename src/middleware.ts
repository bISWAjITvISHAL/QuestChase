import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes requiring active detective clearance / authentication
const PROTECTED_PREFIXES = [
  '/desk',
  '/tasks',
  '/character',
  '/investigate',
  '/board',
  '/cases',
  '/locker',
  '/achievements',
  '/settings',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is protected
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for Supabase session cookies or authorization headers
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some((cookie) => {
    const name = cookie.name.toLowerCase();
    return (
      name.startsWith('sb-') ||
      name.includes('auth-token') ||
      name === 'supabase-auth-token' ||
      name === 'sb_access_token' ||
      name === 'sb_session'
    );
  });

  const authHeader = request.headers.get('authorization');
  const hasAuthHeader = Boolean(authHeader && authHeader.startsWith('Bearer '));

  // If no auth token is found, redirect to /login with redirect parameter
  if (!hasAuthCookie && !hasAuthHeader) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes handle their own 401 JSON responses)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|ogg)$).*)',
  ],
};
