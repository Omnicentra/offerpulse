"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/src/lib/trpc/client";
import { useSession } from "../server/auth/client";

interface WorkspaceContextType {
  workspaceId: string | null;
  workspace: any | null;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaceId: null,
  workspace: null,
  isLoading: true,
});

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  // For now, use a default workspace ID
  // In production, this would come from the user's session or be selectable
  useEffect(() => {
    if (session?.user) {
      // TODO: Get actual workspace from user's memberships
      // For now, use a placeholder
      setWorkspaceId("workspace_demo");
    }
  }, [session]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaceId,
        workspace: null,
        isLoading: !workspaceId,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
}
