"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SubscriptionGuard } from "@/components/subscription-guard";
import { WorkspaceProvider } from "@/src/providers/workspace-provider";
import { SubscriptionProvider } from "@/src/providers/subscription-provider";
import { TawkWidget } from "@/components/tawk-widget";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { SpotlightProvider } from "react-tourlight";
import { posthog } from "posthog-js";
import { useEffect } from "react";
import { useSession } from "@/src/server/auth/client";
import { env } from "@/env";
import type { SpotlightTheme } from "react-tourlight";

const tourTheme: SpotlightTheme = {
  overlay: {
    background: "rgba(11, 18, 32, 0.72)",
  },
  tooltip: {
    background: "transparent",
    color: "transparent",
    borderRadius: "0px",
    boxShadow: "none",
    padding: "0px",
    maxWidth: "400px",
  },
  title: { fontSize: "0px", fontWeight: "0", color: "transparent", marginBottom: "0px" },
  content: { fontSize: "0px", color: "transparent", lineHeight: "0" },
  button: { background: "transparent", color: "transparent", borderRadius: "0px", padding: "0px", fontSize: "0px", fontWeight: "0", border: "none", cursor: "pointer", hoverBackground: "transparent" },
  buttonSecondary: { background: "transparent", color: "transparent", border: "none", hoverBackground: "transparent" },
  progress: { background: "transparent", fill: "transparent", height: "0px", borderRadius: "0px" },
  arrow: { fill: "#ffffff" },
  closeButton: { color: "transparent", hoverColor: "transparent" },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const user = session?.user ?? null;

  const tawkPropertyId = env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
  const tawkWidgetId = env.NEXT_PUBLIC_TAWK_WIDGET_ID;
  // Single identify for all auth methods (email/password + OAuth). Uses non-PII user id only.
  useEffect(() => {
    if (!user) return;
    posthog.identify(user.id, {
      email: user.email,
      name: user.name,
    });
  }, [user]);
  
  return (
    <WorkspaceProvider>
      <SubscriptionProvider>
        <SpotlightProvider
          theme={tourTheme}
          transitionDuration={320}
        >
          <OnboardingTour />
          <SubscriptionGuard>
            <div className="flex h-screen overflow-hidden bg-slate-50">
              <Sidebar />
              <div className="flex flex-1 flex-col overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-y-auto p-6">{children}</main>
              </div>
            </div>
            <TawkWidget
              propertyId={tawkPropertyId}
              widgetId={tawkWidgetId}
              user={user ? { id: user.id, name: user.name, email: user.email } : null}
            />
          </SubscriptionGuard>
        </SpotlightProvider>
      </SubscriptionProvider>
    </WorkspaceProvider>
  );
}
