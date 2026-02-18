import { redirect } from "next/navigation"
import { buildAppLoginUrl } from "@offerpulse/lib/routing"

/**
 * Mock signin page - redirects to real dashboard app login
 * This page exists only for backwards compatibility with old links
 */
export default function SignInPage() {
  // Redirect to real dashboard app login with cross-domain tracking
  redirect(buildAppLoginUrl())
}
