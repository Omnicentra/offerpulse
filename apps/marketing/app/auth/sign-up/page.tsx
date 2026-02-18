import { redirect } from "next/navigation"
import { buildAppSignupUrl } from "@offerpulse/lib/routing"

/**
 * Mock signup page - redirects to real dashboard app signup
 * This page exists only for backwards compatibility with old links
 */
export default function SignUpPage() {
  // Redirect to real dashboard app signup with cross-domain tracking
  redirect(buildAppSignupUrl({ source: "marketing_auth_redirect" }))
}
