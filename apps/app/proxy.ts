import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/src/server/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes (auth pages and onboarding)
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
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
    return NextResponse.redirect(new URL("/overview", request.url));
  }

  // Allow onboarding pages for authenticated users
  if (isOnboardingPage && !isAuthenticated) {
    // Not authenticated, redirect to signup
    return NextResponse.redirect(new URL("/signup", request.url));
  }

  if (!isAuthPage && !isOnboardingPage && !isAuthenticated && pathname !== "/") {
    // Not logged in, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)",
  ],
};
