import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes (auth pages and onboarding)
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isOnboardingPage = pathname.startsWith("/onboarding");
  
  // Check if user is authenticated (check for token in cookies or create a header check)
  // For demo mode, we'll check if the user has visited before by looking at a cookie
  const authToken = request.cookies.get("offerpulse_auth");
  const isAuthenticated = !!authToken?.value;
  
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
  
  if (!isAuthPage && !isOnboardingPage && !isAuthenticated && pathname !== "/" ) {
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
