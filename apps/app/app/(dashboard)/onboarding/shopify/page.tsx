"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
} from "@offerpulse/lib/routing";
import { Loader2, Store, AlertCircle, CheckCircle2 } from "lucide-react";
import { useSession } from "@/src/server/auth/client";
import { useTRPC, useTRPCClient } from "@/src/lib/trpc/client";
import { useMutation } from "@tanstack/react-query";

type ProvisioningStep = "idle" | "connecting" | "creating_competitor" | "capturing_snapshot" | "polling_snapshot" | "complete" | "error";

export default function ShopifyOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { data: session, isPending } = useSession();
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const [shopInput, setShopInput] = useState("");
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [provisioningStep, setProvisioningStep] = useState<ProvisioningStep>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [_createdCompetitorId, setCreatedCompetitorId] = useState<string | null>(null);
  const [_captureJobId, setCaptureJobId] = useState<string | null>(null);

  const workspaceId = session?.user?.workspaceId;

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

  // Check if returning from Shopify OAuth
  useEffect(() => {
    const shopifyConnected = searchParams.get("shopify_connected");
    if (shopifyConnected === "true" && workspaceId) {
      // User just connected Shopify, show success and continue onboarding
      toast({
        title: "Shopify connected",
        description: "Your store has been connected successfully.",
      });
      
      // Auto-continue to provision competitor if URL exists
      setConnectDialogOpen(true);
      completeOnboarding();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, workspaceId]);

  const createCompetitorMutation = useMutation(
    trpc.competitors.create.mutationOptions()
  );

  const triggerCaptureMutation = useMutation(
    trpc.snapshots.capture.mutationOptions()
  );

  const handleConnectShopify = () => {
    if (!shopInput.trim()) {
      toast({
        title: "Enter your store domain",
        description: "Please enter your Shopify store domain (e.g., yourstore.myshopify.com)",
        variant: "destructive",
      });
      return;
    }

    if (!workspaceId) {
      toast({
        title: "Workspace not found",
        description: "Please reload the page and try again",
        variant: "destructive",
      });
      return;
    }

    setConnectDialogOpen(true);
    setProvisioningStep("connecting");

    // Trigger Shopify OAuth flow
    const shop = shopInput.trim();
    const oauthUrl = `/api/shopify/auth/start?shop=${encodeURIComponent(shop)}&workspaceId=${encodeURIComponent(workspaceId)}`;
    
    // Redirect to OAuth start
    window.location.href = oauthUrl;
  };

  const handleSkip = () => {
    // Still allow competitor snapshot even if skipped
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      if (!workspaceId) {
        setProvisioningStep("error");
        setErrorMessage("Workspace not found");
        return;
      }

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

        const competitor = await createCompetitorMutation.mutateAsync({
          workspaceId,
          name: competitorName,
          domain,
          baseUrl: `${url.protocol}//${url.hostname}`,
          platformGuess: domain.includes("myshopify") ? "shopify" : "other",
          tags: [],
          isActive: true,
          frequency: "daily",
          trackPromos: true,
          trackShipping: true,
          trackBundles: true,
          trackCart: true,
          trackDeliveryReturns: true,
        });

        setCreatedCompetitorId(competitor.id);

        // Capture first snapshot
        setProvisioningStep("capturing_snapshot");

        const captureResult = await triggerCaptureMutation.mutateAsync({
          workspaceId,
          competitorId: competitor.id,
        });

        setCaptureJobId(captureResult.jobId);
        setProvisioningStep("polling_snapshot");

        // Poll for completion
        await pollSnapshotCompletion(captureResult.jobId);

        setProvisioningStep("complete");

        // Clear onboarding intent
        clearOnboardingIntent();

        // Show success and navigate
        setTimeout(() => {
          setConnectDialogOpen(false);
          
          toast({
            title: "Welcome to OfferPulse!",
            description: "Your first competitor has been added and snapshot captured.",
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

  const pollSnapshotCompletion = async (jobId: string): Promise<void> => {
    if (!workspaceId) return;

    const maxAttempts = 30; // 30 attempts * 2s = 60s timeout
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between polls
      
      try {
        const statusData = await trpcClient.snapshots.captureStatus.query({
          workspaceId,
          jobId,
        });

        if (statusData.status === "completed") {
          return;
        }

        if (statusData.status === "failed") {
          throw new Error(statusData.error || "Snapshot capture failed");
        }

        attempts++;
      } catch (error) {
        throw error;
      }
    }

    throw new Error("Snapshot capture timed out");
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
        return "Triggering first snapshot...";
      case "polling_snapshot":
        return "Capturing competitor offers...";
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
            We&apos;ll use this to personalize recommendations and track your store
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-950/5">
          <div className="space-y-6">
            <div>
              <Label htmlFor="shopDomain">Shopify Store Domain</Label>
              <Input
                id="shopDomain"
                type="text"
                placeholder="yourstore.myshopify.com"
                value={shopInput}
                onChange={(e) => setShopInput(e.target.value)}
                className="mt-2 h-11"
                disabled={provisioningStep !== "idle"}
              />
              <p className="mt-2 text-xs text-slate-500">
                Connect your Shopify store to personalize AI recommendations
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleConnectShopify}
                className="h-12 w-full gap-2"
                disabled={provisioningStep !== "idle" || !shopInput.trim()}
              >
                {provisioningStep === "connecting" ? (
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

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Optional step</p>
                  <p className="mt-1 text-xs text-blue-800">
                    You can connect Shopify later in Settings. This helps us compare competitor offers against your store&apos;s pricing.
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
                        width: provisioningStep === "connecting" ? "25%" :
                               provisioningStep === "creating_competitor" ? "50%" :
                               provisioningStep === "capturing_snapshot" ? "75%" :
                               provisioningStep === "polling_snapshot" ? "90%" : "0%"
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {provisioningStep === "connecting" && "Authenticating with Shopify..."}
                    {provisioningStep === "creating_competitor" && "Setting up your workspace..."}
                    {provisioningStep === "capturing_snapshot" && "Triggering snapshot..."}
                    {provisioningStep === "polling_snapshot" && "Analyzing competitor offers..."}
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
