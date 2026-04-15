"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Store, AlertCircle } from "lucide-react";
import { useSession } from "@/src/server/auth/client";
import { useState } from "react";

export default function ShopifyOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { data: session, isPending } = useSession();

  const [shopInput, setShopInput] = useState("");

  const workspaceId = session?.user?.workspaceId;

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.replace("/login");
    }
  }, [session?.user, isPending, router]);

  useEffect(() => {
    const shopifyConnected = searchParams.get("shopify_connected");
    if (shopifyConnected === "true" && workspaceId) {
      toast({
        title: "Shopify connected",
        description: "Your store has been connected successfully.",
      });
      router.replace("/?welcome=1");
    }
  }, [searchParams, workspaceId, router, toast]);

  const handleConnectShopify = () => {
    if (!shopInput.trim()) {
      toast({
        title: "Enter your store domain",
        description:
          "Please enter your Shopify store domain (e.g., yourstore.myshopify.com)",
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

    const shop = shopInput.trim();
    const oauthUrl = `/api/shopify/auth/start?shop=${encodeURIComponent(shop)}&workspaceId=${encodeURIComponent(workspaceId)}`;
    window.location.href = oauthUrl;
  };

  const handleSkip = () => {
    router.push("/?welcome=1");
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
            Optional
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            Connect Shopify
          </h1>
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
              />
              <p className="mt-2 text-xs text-slate-500">
                Connect your Shopify store to personalize AI recommendations
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleConnectShopify}
                className="h-12 w-full gap-2"
                disabled={!shopInput.trim()}
              >
                <Store className="h-5 w-5" />
                Connect Shopify
              </Button>

              <Button variant="ghost" onClick={handleSkip} className="w-full">
                Skip for now
              </Button>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Optional step</p>
                  <p className="mt-1 text-xs text-blue-800">
                    You can connect Shopify later in Settings. Competitor monitoring is
                    already available from your dashboard.
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
    </div>
  );
}
