"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import posthog from "posthog-js";
import { signIn, signUp, useSession } from "@/src/server/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTRPC, useTRPCClient } from "@/src/lib/trpc/client";
import {
  PRICING_PLANS,
  formatPrice,
  type PricingPlan,
} from "@offerpulse/lib/pricing";
import { Check, Loader2 } from "lucide-react";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

type Step = "register" | "plan";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: isSessionPending } = useSession();
  const { toast } = useToast();
  const trpcClient = useTRPCClient();

  const [step, setStep] = useState<Step>("register");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>(PRICING_PLANS[0]);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  useEffect(() => {
    posthog.capture("signup_page_viewed");
  }, []);

  useEffect(() => {
    const marketingDeviceId = searchParams.get("ph_device_id");
    if (marketingDeviceId) {
      try {
        posthog.alias(marketingDeviceId);
      } catch (error) {
        console.error("Failed to alias PostHog device ID:", error);
      }
    }

    if (searchParams.get("checkout") === "cancelled") {
      toast({
        title: "Checkout cancelled",
        description: "You can select a plan whenever you're ready.",
      });
    }
  }, [searchParams, toast]);

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    posthog.capture("signup_form_submitted", { has_name: !!data.name });

    try {
      const { data: signUpData, error } = await signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (error) {
        posthog.capture("signup_error", { error_message: error.message });
        toast({
          title: "Signup failed",
          description: error.message ?? "An error occurred. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const userId = signUpData?.user?.id;
      if (userId) {
        posthog.identify(userId, {
          email: data.email,
          name: data.name,
          signed_up_at: new Date().toISOString(),
        });
      }
      posthog.capture("signup_completed", { source: "dashboard_app" });

      setStep("plan");
    } catch (error) {
      posthog.capture("signup_error", {
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    posthog.capture("signup_google_clicked");
    try {
      const { error } = await signIn.social({
        provider: "google",
        callbackURL: "/signup?step=plan",
      });
      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message ?? "Could not sign up with Google.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Sign up failed",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleCheckout = async () => {
    setIsCheckoutLoading(true);
    const lookupKey =
      billingInterval === "monthly"
        ? selectedPlan.stripeLookupKeyMonthly
        : selectedPlan.stripeLookupKeyYearly;

    posthog.capture("checkout_started", {
      plan: selectedPlan.id,
      interval: billingInterval,
      lookup_key: lookupKey,
    });

    try {
      const result = await trpcClient.billing.createCheckoutSession.mutate({
        lookupKey,
      });
      window.location.href = result.sessionUrl;
    } catch (error) {
      toast({
        title: "Checkout failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not start checkout. Please try again.",
        variant: "destructive",
      });
      setIsCheckoutLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("step") !== "plan") return;
    if (session?.user) {
      setStep("plan");
    } else if (!isSessionPending) {
      setStep("register");
    }
  }, [searchParams, session?.user, isSessionPending]);

  if (step === "plan") {
    const price =
      billingInterval === "monthly"
        ? selectedPlan.monthlyPrice
        : selectedPlan.yearlyPrice;

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Choose your plan
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              All plans include a 14-day free trial. Cancel anytime.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
              <button
                onClick={() => setBillingInterval("monthly")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  billingInterval === "monthly"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval("yearly")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  billingInterval === "yearly"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Yearly
                <span className="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  2 months free
                </span>
              </button>
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {PRICING_PLANS.map((plan) => {
              const isSelected = selectedPlan.id === plan.id;
              const planPrice =
                billingInterval === "monthly"
                  ? plan.monthlyPrice
                  : plan.yearlyPrice;

              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`relative rounded-2xl border-2 p-6 text-left transition-all ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/30 shadow-lg shadow-blue-100"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-medium text-white">
                      Popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-slate-900">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{plan.tagline}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-slate-900">
                      {formatPrice(planPrice)}
                    </span>
                    <span className="text-sm text-slate-600">
                      /{billingInterval === "monthly" ? "mo" : "yr"}
                    </span>
                  </div>
                  <ul className="mt-5 space-y-2">
                    {plan.features
                      .filter((f) => f.included)
                      .slice(0, 5)
                      .map((feature) => (
                        <li
                          key={feature.text}
                          className="flex items-start gap-2 text-sm text-slate-700"
                        >
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                          <span>{feature.text}</span>
                        </li>
                      ))}
                  </ul>
                  <p className="mt-4 text-xs text-slate-500">
                    Max {plan.maxWorkspaces} workspace
                    {plan.maxWorkspaces > 1 ? "s" : ""}
                  </p>
                </button>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <Button
              size="lg"
              className="h-12 px-8"
              onClick={handleCheckout}
              disabled={isCheckoutLoading}
            >
              {isCheckoutLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting to checkout...
                </>
              ) : (
                `Start free trial — ${formatPrice(price)}/${billingInterval === "monthly" ? "mo" : "yr"} after`
              )}
            </Button>
            <p className="mt-3 text-xs text-slate-500">
              14-day free trial. You won&apos;t be charged today.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600">
              <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">OfferPulse</h1>
          <p className="mt-2 text-sm text-slate-600">Create your account</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-950/5">
          <Button
            type="button"
            variant="outline"
            className="mb-5 h-11 w-full border-slate-200 bg-white hover:bg-slate-50"
            disabled={isGoogleLoading || isLoading}
            onClick={onGoogleSignUp}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {isGoogleLoading ? "Signing up..." : "Continue with Google"}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                {...register("name")}
                className="h-11"
                aria-invalid={errors.name ? "true" : "false"}
              />
              {errors.name && (
                <p className="text-sm text-red-600" role="alert">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                className="h-11"
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email && (
                <p className="text-sm text-red-600" role="alert">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                {...register("password")}
                className="h-11"
                aria-invalid={errors.password ? "true" : "false"}
              />
              {errors.password && (
                <p className="text-sm text-red-600" role="alert">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="h-11 w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignupFormFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">OfferPulse</h1>
          <p className="mt-2 text-sm text-slate-600">Create your account</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-950/5">
          <div className="space-y-5">
            <div className="h-11 rounded-md bg-slate-100 animate-pulse" />
            <div className="h-11 rounded-md bg-slate-100 animate-pulse" />
            <div className="h-11 rounded-md bg-slate-100 animate-pulse" />
            <div className="h-11 rounded-md bg-slate-200 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFormFallback />}>
      <SignupForm />
    </Suspense>
  );
}
