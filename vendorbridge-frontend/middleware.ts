import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const role = request.cookies.get('auth-role')?.value;

  const path = request.nextUrl.pathname;

  // Protect all dashboard routes - redirect to login if no token
  if (!token) {
    if (path.startsWith('/admin') || 
        path.startsWith('/officer') || 
        path.startsWith('/vendor') || 
        path.startsWith('/manager')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Enforce role access control for dashboard routes
  if (token) {
    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (path.startsWith('/officer') && role !== 'officer') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (path.startsWith('/vendor') && role !== 'vendor') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (path.startsWith('/manager') && role !== 'manager') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (token && (path === '/login' || path === '/signup' || path === '/')) {
    if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
    if (role === 'officer') return NextResponse.redirect(new URL('/officer', request.url));
    if (role === 'vendor') return NextResponse.redirect(new URL('/vendor', request.url));
    if (role === 'manager') return NextResponse.redirect(new URL('/manager', request.url));
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/', 
    '/admin/:path*', 
    '/officer/:path*', 
    '/vendor/:path*', 
    '/manager/:path*', 
    '/login', 
    '/signup'
  ],
};
