"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CollapsibleSidebar } from "@/components/layout/CollapsibleSidebar";
import { authApi } from "@/src/mock/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Check authentication
    if (!authApi.isAuthenticated()) {
      router.replace("/login");
    }
  }, [router]);

  // Show loading state on server/initial render
  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <CollapsibleSidebar />

      {/* Mobile sidebar */}
      <CollapsibleSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile />

      {/* Main content - no topbar */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
