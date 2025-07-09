import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes (adjust as needed)
const protectedRoutes = ['/dashboard', '/profile', '/user'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Example: check for a cookie named "auth"
    const isLoggedIn = request.cookies.get('auth')?.value;

    if (!isLoggedIn) {
      // Redirect to "You seem lost" page if not authenticated
      return NextResponse.redirect(new URL('/lost', request.url));
    }
  }

  return NextResponse.next();
}

// Specify the matcher for which routes to run the middleware on
export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/user/:path*'],
};