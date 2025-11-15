import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware for Kill Switch
 *
 * Checks if a white page URL is in the kill list and redirects to 404
 * Note: This requires the kill list to be accessible at runtime
 */

export function middleware(request: NextRequest) {
  // Only process white page routes (paths that match the slug pattern)
  const pathname = request.nextUrl.pathname;

  // Match white page patterns like /offer-123-abc123
  // Skip API routes, static files, and Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // TODO: Check kill list from edge config or database
  // For now, this is a placeholder. To fully implement:
  // 1. Use Vercel Edge Config to store kill list
  // 2. Or use a database like Redis/Upstash
  // 3. Or fetch from GitHub (not recommended for performance)

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
