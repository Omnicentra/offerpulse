import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CANONICAL_HOST, REDIRECT_HOSTS } from "./lib/seo/config";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // Force HTTPS and canonical host
  const isNonCanonical =
    REDIRECT_HOSTS.includes(host) || host.startsWith("localhost");

  // In production, redirect to canonical host
  if (
    process.env.NODE_ENV === "production" &&
    isNonCanonical &&
    !host.includes("localhost") &&
    !host.includes("vercel.app")
  ) {
    const canonicalUrl = new URL(pathname + search, `https://${CANONICAL_HOST}`);
    return NextResponse.redirect(canonicalUrl, { status: 301 });
  }

  // Force HTTPS in production
  const proto = request.headers.get("x-forwarded-proto");
  if (process.env.NODE_ENV === "production" && proto === "http") {
    const httpsUrl = new URL(pathname + search, `https://${host}`);
    return NextResponse.redirect(httpsUrl, { status: 301 });
  }

  // Trailing slash consistency - remove trailing slashes except for root
  if (pathname !== "/" && pathname.endsWith("/")) {
    const urlWithoutTrailingSlash = new URL(pathname.slice(0, -1) + search, request.url);
    return NextResponse.redirect(urlWithoutTrailingSlash, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg (favicon files)
     * - images in public folder
     * - /ingest, /_px (PostHog proxy - must not run proxy or redirects turn POST into GET → 400)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|ingest(?:$|/)|_px(?:$|/)|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
