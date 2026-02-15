"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Activity, Loader2, CheckCircle, ArrowRight } from "lucide-react"
import { signUpSchema, type SignUpInput } from "@offerpulse/lib/validators"
import { track } from "@/lib/analytics"
import { useToast } from "@/hooks/use-toast"
import posthog from "posthog-js"

function SignUpForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const competitorUrl = searchParams.get("competitorUrl") || ""

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      storeUrl: "",
      competitorUrl: competitorUrl ? decodeURIComponent(competitorUrl) : "",
    },
  })

  const onSubmit = async (data: SignUpInput) => {
    setIsSubmitting(true)
    track("cta_signup_clicked", { source: "signup_form" })

    // Track signup form submission in PostHog
    posthog.capture("signup_form_submitted", {
      has_store_url: !!data.storeUrl,
      has_competitor_url: !!data.competitorUrl,
      source: "signup_form",
    })

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock success
    toast({
      title: "Account created",
      description: "Welcome to OfferPulse. Your 14-day free trial has started.",
    })

    // Identify user and track signup completion in PostHog
    posthog.identify(data.email, {
      email: data.email,
      store_url: data.storeUrl || undefined,
      signed_up_at: new Date().toISOString(),
    })
    posthog.capture("signup_completed", {
      email: data.email,
      has_store_url: !!data.storeUrl,
      has_competitor_url: !!data.competitorUrl,
    })

    setIsSuccess(true)
    setIsSubmitting(false)
  }

  if (isSuccess) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Account created
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Welcome to OfferPulse! Your 14-day free trial has started.
          </p>
          <Button
            className="mt-6 w-full"
            onClick={() => router.push("/")}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          Start your 14-day free trial. No credit card required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="storeUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your store URL (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://your-store.myshopify.com"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="competitorUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First competitor to track (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://competitor-store.com"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </Form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-border" />
          <span className="px-4 text-xs text-muted-foreground">or</span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* Google SSO (disabled) */}
        <Button variant="outline" className="w-full" disabled>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google (coming soon)
        </Button>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  )
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Activity className="h-5 w-5 text-primary-foreground" />
          <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
        </div>
        <span className="text-xl font-semibold text-foreground">OfferPulse</span>
      </Link>

      <Suspense fallback={
        <Card className="mx-auto w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      }>
        <SignUpForm />
      </Suspense>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        No card required • Cancel anytime
      </p>
    </div>
  )
}
