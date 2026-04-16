"use client";

import { useSession } from "@/src/server/auth/client";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { consumePendingSnapshotAndNavigate } from "@/lib/consume-pending-snapshot-client";

export default function AfterSignInPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const ran = useRef(false);

  useEffect(() => {
    if (isPending || ran.current) return;
    if (!session?.user) {
      router.replace("/login");
      return;
    }
    ran.current = true;
    if (process.env.NODE_ENV === "development") {
      const dbg = globalThis.console.debug;
      if (typeof dbg === "function") {
        dbg.call(globalThis.console, "[pending-offer-flow:client]", "after-sign-in: consume", {
          userId: session.user.id,
        });
      }
    }
    void consumePendingSnapshotAndNavigate((path) => router.replace(path), "/");
  }, [isPending, session?.user, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4">
      <p className="text-sm font-medium text-slate-800">Setting up your workspace…</p>
      <p className="text-xs text-slate-500">This only takes a moment.</p>
    </div>
  );
}
