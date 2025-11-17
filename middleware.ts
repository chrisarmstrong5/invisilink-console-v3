import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { config as appConfig } from "./lib/config";

/**
 * Middleware for Security and Kill Switch
 *
 * Handles:
 * 1. Domain-based routing (cloak domains vs admin domain)
 * 2. Admin domain protection (Vercel URLs only)
 * 3. Kill switch for burned links
 * 4. 404 for invalid routes on cloak domains
 *
 * Security Model:
 * - Admin interface ONLY accessible via .vercel.app domains
 * - Cloak domains (appflow32.com, etc.) ONLY serve white pages
 * - Root access on cloak domains returns 404
 */

/**
 * Check if hostname is an admin domain
 */
function isAdminDomain(hostname: string): boolean {
  const { adminDomain, additionalAdminDomains } = appConfig.security;

  // Remove port for localhost comparison
  const hostWithoutPort = hostname.split(":")[0];

  // Check if this is a Vercel deployment (all .vercel.app domains are admin)
  if (hostWithoutPort.endsWith(".vercel.app")) {
    return true;
  }

  // Check primary admin domain
  if (hostname === adminDomain || hostWithoutPort === adminDomain) {
    return true;
  }

  // Check additional admin domains
  return additionalAdminDomains.some(
    (domain) => hostname === domain || hostWithoutPort === domain.split(":")[0]
  );
}

/**
 * Check if path is a valid slug pattern
 * Slugs match: /offer-account-timestamp (e.g., /apple-1639-abc123)
 */
function isValidSlugPattern(pathname: string): boolean {
  // Remove leading slash
  const slug = pathname.slice(1);

  // Slug pattern: alphanumeric (upper and lowercase) + hyphens + underscores, 10-50 chars
  // Format: offer-account-timestamp
  const slugRegex = /^[a-zA-Z0-9_-]{10,50}$/;

  return slugRegex.test(slug);
}

/**
 * Check if link is in kill list
 * In production, this should check Vercel Edge Config or database
 * For now, we'll skip this check as kill list is in localStorage
 */
function isLinkKilled(slug: string): boolean {
  // TODO: Implement kill list check from Edge Config or database
  // Currently, kill list is only in localStorage (client-side)
  // To fully implement:
  // 1. Use Vercel Edge Config to store kill list
  // 2. Or use a database like Redis/Upstash
  // 3. Sync kill list from localStorage to Edge Config via API

  return false; // Placeholder
}

/**
 * Admin routes that require authentication
 */
const ADMIN_ROUTES = [
  "/",
  "/links",
  "/spark-codes",
  "/spark-codes-analytics",
  "/competitors",
];

const ADMIN_API_ROUTES = [
  "/api/whitepage/generate",
  "/api/github/commit",
  "/api/redtrack",
  "/api/upload",
  "/api/kill-list",
  "/api/spark-codes",
  "/api/competitors",
  "/api/boost-history",
  "/api/migrate",
  "/api/smm",
  "/api/spend",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // Skip Next.js internals and static files
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Determine if this is an admin domain or cloak domain
  const isAdmin = isAdminDomain(hostname);

  if (isAdmin) {
    // ===== ADMIN DOMAIN LOGIC (.vercel.app URLs) =====
    // Allow all routes on Vercel URLs - this is our admin interface
    return NextResponse.next();
  } else {
    // ===== CLOAK DOMAIN LOGIC =====

    // Block all admin routes on cloak domains
    if (
      ADMIN_ROUTES.includes(pathname) ||
      ADMIN_API_ROUTES.some((route) => pathname.startsWith(route))
    ) {
      // Return 404 to hide admin interface
      return new NextResponse(null, { status: 404 });
    }

    // Check if this is a valid slug pattern
    if (!isValidSlugPattern(pathname)) {
      // Invalid slug or root access → 404
      return new NextResponse(null, { status: 404 });
    }

    // Extract slug from pathname
    const slug = pathname.slice(1);

    // Check kill list
    if (isLinkKilled(slug)) {
      // Link is killed → 404
      return new NextResponse(null, { status: 404 });
    }

    // Valid slug on cloak domain → allow white page to be served
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
