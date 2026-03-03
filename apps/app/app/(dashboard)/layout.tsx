"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SubscriptionGuard } from "@/components/subscription-guard";
import { WorkspaceProvider } from "@/src/providers/workspace-provider";
import { SubscriptionProvider } from "@/src/providers/subscription-provider";
import { posthog } from "posthog-js";
import { useEffect } from "react";
import { useSession } from "@/src/server/auth/client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const user = session?.user ?? null;

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
        </SubscriptionGuard>
      </SubscriptionProvider>
    </WorkspaceProvider>
  );
}
