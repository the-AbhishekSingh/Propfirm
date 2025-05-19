import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // This middleware just ensures that unauthenticated users
  // are redirected to the auth page if they try to access the dashboard.
  // Note: Client-side authentication is the primary method with Crossmint,
  // so this is just an extra layer of protection.

  // For client-side wallet connections, most authentication logic
  // will happen in the components using the useCrossmint hook.

  const path = request.nextUrl.pathname;
  
  // Add paths that require authentication
  const protectedPaths = ['/dashboard'];
  
  const isProtectedPath = protectedPaths.some(
    (protectedPath) => path.startsWith(protectedPath)
  );

  if (isProtectedPath) {
    // Client-side validation will handle the actual auth check
    // This is just a fail-safe to prevent direct URL access
    const redirectUrl = new URL('/auth', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Matcher for paths that require auth check
  matcher: ['/dashboard/:path*'],
}; 