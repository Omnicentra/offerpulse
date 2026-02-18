"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  getOnboardingIntent,
  clearOnboardingIntent,
  STORAGE_KEYS,
} from "@offerpulse/lib/routing";
import { competitorsApi, snapshotsApi, monitorSettingsApi } from "@/src/mock/api";
import { Loader2, Store, AlertCircle, CheckCircle2 } from "lucide-react";
import { useSession } from "@/src/server/auth/client";

type ProvisioningStep = "idle" | "connecting" | "creating_competitor" | "capturing_snapshot" | "complete" | "error";

export default function ShopifyOnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, isPending } = useSession();

  const [storeDomain, setStoreDomain] = useState("");
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [provisioningStep, setProvisioningStep] = useState<ProvisioningStep>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [createdCompetitorId, setCreatedCompetitorId] = useState<string | null>(null);

  // Check auth and onboarding intent on mount
  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.replace("/login");
      return;
    }

    // Check if onboarding intent exists, redirect to overview if not
    const intent = getOnboardingIntent();
    if (!intent) {
      router.replace("/overview");
    }
  }, [session?.user, isPending, router]);

  const handleConnectShopify = () => {
    setConnectDialogOpen(true);
    // Simulate Shopify OAuth flow
    setTimeout(() => {
      simulateShopifyConnect();
    }, 800);
  };

  const simulateShopifyConnect = () => {
    setProvisioningStep("connecting");

    // Simulate successful connection after delay
    setTimeout(() => {
      // Store Shopify connection in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.SHOPIFY_CONNECTED, "true");
        localStorage.setItem(STORAGE_KEYS.SHOPIFY_STORE_DOMAIN, storeDomain || "demo-store.myshopify.com");
      }

      // Start onboarding provisioning
      completeOnboarding();
    }, 1500);
  };

  const handleSkip = () => {
    // Still allow competitor snapshot even if skipped
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      const intent = getOnboardingIntent();
      
      if (!intent) {
        router.push("/overview?welcome=1");
        return;
      }

      // If competitor URL exists, provision it
      if (intent.competitorUrl) {
        setProvisioningStep("creating_competitor");

        // Create competitor from URL
        const url = new URL(intent.competitorUrl);
        const domain = url.hostname.replace("www.", "");
        const competitorName = domain.split(".")[0]
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        const competitor = await competitorsApi.create({
          name: competitorName,
          domain,
          baseUrl: `${url.protocol}//${url.hostname}`,
          platformGuess: domain.includes("myshopify") || Math.random() > 0.5 ? "shopify" : "other",
          tags: [],
          isActive: true,
        });

        setCreatedCompetitorId(competitor.id);

        // Create monitor settings with default tracking
        await monitorSettingsApi.upsert({
          competitorId: competitor.id,
          frequency: "daily",
          track: {
            promos: true,
            shipping: true,
            bundles: true,
            cart: true,
            deliveryReturns: true,
          },
        });

        // Capture first snapshot (free)
        setProvisioningStep("capturing_snapshot");

        const result = await snapshotsApi.capture(competitor.id);

        setProvisioningStep("complete");

        // Clear onboarding intent
        clearOnboardingIntent();

        // Show success and navigate
        setTimeout(() => {
          setConnectDialogOpen(false);
          
          toast({
            title: "Welcome to OfferPulse! 🎉",
            description: result.changeEvent 
              ? "Your first snapshot captured a change!" 
              : "Your first snapshot has been captured.",
          });

          router.push(`/competitors/${competitor.id}?welcome=1`);
        }, 1500);
      } else {
        // No competitor URL, just go to overview
        clearOnboardingIntent();
        setConnectDialogOpen(false);
        router.push("/overview?welcome=1");
      }
    } catch (error) {
      setProvisioningStep("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to provision competitor");
    }
  };

  const handleRetry = () => {
    setProvisioningStep("idle");
    setErrorMessage("");
    setConnectDialogOpen(false);
  };

  const getStepMessage = () => {
    switch (provisioningStep) {
      case "connecting":
        return "Connecting to Shopify...";
      case "creating_competitor":
        return "Adding competitor to your workspace...";
      case "capturing_snapshot":
        return "Capturing first snapshot...";
      case "complete":
        return "All set! Redirecting...";
      case "error":
        return "Something went wrong";
      default:
        return "";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600">
              <Store className="h-7 w-7 text-white" />
            </div>
          </div>
          <div className="mb-2 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
            Step 2 of 2
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Connect Shopify</h1>
          <p className="mt-2 text-sm text-slate-600">
            We'll use this to personalize recommendations and track your store
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-950/5">
          <div className="space-y-6">
            <div>
              <Label htmlFor="storeDomain">Shopify Store Domain (Optional)</Label>
              <Input
                id="storeDomain"
                type="text"
                placeholder="your-store.myshopify.com"
                value={storeDomain}
                onChange={(e) => setStoreDomain(e.target.value)}
                className="mt-2 h-11"
              />
              <p className="mt-2 text-xs text-slate-500">
                This helps us provide better recommendations for your specific store
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleConnectShopify}
                className="h-12 w-full gap-2"
                disabled={provisioningStep !== "idle"}
              >
                {provisioningStep !== "idle" ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Store className="h-5 w-5" />
                    Connect Shopify
                  </>
                )}
              </Button>

              <Button 
                variant="ghost" 
                onClick={handleSkip}
                className="w-full"
                disabled={provisioningStep !== "idle"}
              >
                Skip for now
              </Button>
            </div>

            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Demo Mode</p>
                  <p className="mt-1 text-xs text-yellow-800">
                    In production, this would initiate Shopify OAuth. For now, we'll simulate the connection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          You can always connect Shopify later in Settings
        </p>
      </div>

      {/* Provisioning Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" showClose={false}>
          <DialogHeader>
            <DialogTitle>
              {provisioningStep === "error" ? "Connection Failed" : "Setting up your account"}
            </DialogTitle>
            <DialogDescription>
              {provisioningStep === "error" 
                ? "We encountered an issue during setup"
                : "Please wait while we configure your workspace"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {provisioningStep === "error" ? (
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <p className="mt-4 text-sm text-slate-700">{errorMessage}</p>
                <div className="mt-6 flex gap-3">
                  <Button variant="outline" onClick={handleRetry} className="flex-1">
                    Try Again
                  </Button>
                  <Button onClick={() => router.push("/overview")} className="flex-1">
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            ) : provisioningStep === "complete" ? (
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-900">
                  {getStepMessage()}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <p className="text-sm font-medium text-slate-900">{getStepMessage()}</p>
                </div>
                <div className="space-y-2">
                  <div className={`h-2 overflow-hidden rounded-full bg-slate-100`}>
                    <div 
                      className="h-full bg-blue-600 transition-all duration-500"
                      style={{
                        width: provisioningStep === "connecting" ? "33%" :
                               provisioningStep === "creating_competitor" ? "66%" :
                               provisioningStep === "capturing_snapshot" ? "100%" : "0%"
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {provisioningStep === "connecting" && "Authenticating with Shopify..."}
                    {provisioningStep === "creating_competitor" && "Creating your workspace..."}
                    {provisioningStep === "capturing_snapshot" && "Capturing your first snapshot..."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
