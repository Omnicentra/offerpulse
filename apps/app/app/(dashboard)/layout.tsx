"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SubscriptionGuard } from "@/components/subscription-guard";
import { WorkspaceProvider } from "@/src/providers/workspace-provider";
import { SubscriptionProvider } from "@/src/providers/subscription-provider";
import { TawkWidget } from "@/components/tawk-widget";
import { posthog } from "posthog-js";
import { useEffect } from "react";
import { useSession } from "@/src/server/auth/client";
import { env } from "@/env";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const user = session?.user ?? null;

  const tawkPropertyId = env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
  const tawkWidgetId = env.NEXT_PUBLIC_TAWK_WIDGET_ID;
  console.log("[tawk.to] tawkPropertyId", tawkPropertyId);
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
      </SubscriptionProvider>
    </WorkspaceProvider>
  );
}
