"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@/src/mock/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { storeOnboardingIntent, isValidUrl } from "@offerpulse/lib/routing";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  competitorUrl: z.string().optional().refine((url) => !url || isValidUrl(url), {
    message: "Please enter a valid URL",
  }),
});

type SignupForm = z.infer<typeof signupSchema>;

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get query params
  const competitorUrl = searchParams.get("competitorUrl");
  const source = searchParams.get("source");
  const utm_source = searchParams.get("utm_source");
  const utm_medium = searchParams.get("utm_medium");
  const utm_campaign = searchParams.get("utm_campaign");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      competitorUrl: competitorUrl || "",
    },
  });

  // Set competitor URL when params change
  useEffect(() => {
    if (competitorUrl) {
      setValue("competitorUrl", competitorUrl);
    }
  }, [competitorUrl, setValue]);

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      // Store onboarding intent before creating account
      storeOnboardingIntent({
        competitorUrl: data.competitorUrl || undefined,
        source: source || undefined,
        utm_source: utm_source || undefined,
        utm_medium: utm_medium || undefined,
        utm_campaign: utm_campaign || undefined,
      });

      // Create account
      await authApi.signup(data.name, data.email, data.password);
      
      toast({
        title: "Account created!",
        description: "Let's connect your Shopify store.",
      });

      // Route to Shopify connect (Step 2 of 2)
      router.push("/onboarding/shopify");
    } catch (error) {
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          {competitorUrl && (
            <div className="mb-6 rounded-xl bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-900">Step 1 of 2</p>
              <p className="mt-1 text-xs text-blue-700">
                Create your account to start monitoring competitors
              </p>
            </div>
          )}
          {!competitorUrl && (
            <div className="mb-6 rounded-xl bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-900">Demo Mode</p>
              <p className="mt-1 text-xs text-blue-700">
                Enter any details to create your demo account
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...register("name")}
                className="h-11"
                aria-invalid={errors.name ? "true" : "false"}
              />
              {errors.name && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.name.message}
                </p>
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
                <p className="text-sm text-red-600" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {competitorUrl && (
              <div className="space-y-2">
                <Label htmlFor="competitorUrl">Competitor URL</Label>
                <Input
                  id="competitorUrl"
                  type="url"
                  placeholder="https://competitor.com"
                  {...register("competitorUrl")}
                  className="h-11"
                  aria-invalid={errors.competitorUrl ? "true" : "false"}
                />
                {errors.competitorUrl && (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.competitorUrl.message}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  We'll create your first competitor monitor and capture a snapshot
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  {...register("password")}
                  className="h-11 pr-10"
                  aria-invalid={errors.password ? "true" : "false"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.password.message}
                </p>
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

        <p className="mt-8 text-center text-xs text-slate-500">
          Protected by demo authentication. All data is stored locally.
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    }>
      <SignupPageContent />
    </Suspense>
  );
}
