import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/src/server/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes (auth pages and onboarding)
  const AUTH_PAGES = ["/login", "/signup", "/reset-password", "/forgot-password"];
  const isAuthPage = AUTH_PAGES.some((route) => pathname.startsWith(route));
  const isOnboardingPage = pathname.startsWith("/onboarding");
  const isApiRoute = pathname.startsWith("/api");

  // Skip middleware for API routes (they handle auth themselves)
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Check authentication using Better-auth
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isAuthenticated = !!session;

  // Redirect logic
  if (isAuthPage && isAuthenticated) {
    // Already logged in, redirect to dashboard
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Allow onboarding pages for authenticated users
  if (isOnboardingPage && !isAuthenticated) {
    // Not authenticated, redirect to signup
    return NextResponse.redirect(new URL("/signup", request.url));
  }

  if (!isAuthPage && !isOnboardingPage && !isAuthenticated) {
    // Not logged in, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude /_px (PostHog rewrites). Auth-gating those URLs redirected /_px/static/*.js to
    // /login (HTML) and caused SyntaxError: Unexpected token '<' — Sentry OFFERPULSE-6.
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|_px(?:$|/)).*)",
  ],
};
