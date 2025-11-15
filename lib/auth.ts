/**
 * Simple Password Authentication Utilities
 *
 * Provides basic password protection for the admin console.
 * Uses HTTP-only cookies for session management.
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * Session cookie configuration
 */
export const AUTH_COOKIE_NAME = "invisilink_auth_session";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Check if password matches the environment variable
 */
export function verifyPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.warn("ADMIN_PASSWORD environment variable not set");
    return false;
  }

  return password === adminPassword;
}

/**
 * Generate a simple session token
 * In production, use a proper JWT or session library
 */
export function generateSessionToken(): string {
  return Buffer.from(
    `invisilink-${Date.now()}-${Math.random().toString(36)}`
  ).toString("base64");
}

/**
 * Verify session token from cookie
 * Simple implementation - just checks if cookie exists
 * In production, validate JWT or check database
 */
export function verifySessionToken(token: string): boolean {
  // Simple validation: check if it's a base64 string starting with our prefix
  try {
    const decoded = Buffer.from(token, "base64").toString();
    return decoded.startsWith("invisilink-");
  } catch {
    return false;
  }
}

/**
 * Check if request is authenticated (server-side)
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_COOKIE_NAME);

  if (!sessionToken || !sessionToken.value) {
    return false;
  }

  return verifySessionToken(sessionToken.value);
}

/**
 * Check if request is authenticated (middleware)
 */
export function isAuthenticatedMiddleware(request: NextRequest): boolean {
  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME);

  if (!sessionToken || !sessionToken.value) {
    return false;
  }

  return verifySessionToken(sessionToken.value);
}

/**
 * Create authenticated response with session cookie
 */
export function createAuthenticatedResponse(
  response: NextResponse
): NextResponse {
  const sessionToken = generateSessionToken();

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}

/**
 * Clear authentication cookie (logout)
 */
export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
