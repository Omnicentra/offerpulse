"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "../server/auth/client";
import { useTRPC } from "@/src/lib/trpc/client";

interface WorkspaceContextType {
  workspaceId: string | null;
  workspace: { id: string; name: string; slug: string; role: string } | null;
  workspaces: { id: string; name: string; slug: string; role: string }[];
  isLoading: boolean;
  setWorkspaceId: (id: string | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaceId: null,
  workspace: null,
  workspaces: [],
  isLoading: true,
  setWorkspaceId: () => {},
});

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const trpc = useTRPC();

  const { data: workspaces = [], isLoading: isLoadingWorkspaces } = useQuery(
    trpc.users.getMyWorkspaces.queryOptions(undefined, {
      enabled: !!session?.user,
    })
  );

  // Set default workspace to first one when workspaces load
  useEffect(() => {
    console.debug("[workspace-provider] useEffect", {
      user: session?.user,
      workspaces: workspaces.map((w) => ({ id: w.id, name: w.name })),
      workspaceId,
    });
    if (session?.user && workspaces.length > 0 && !workspaceId) {
      setWorkspaceId(workspaces[0].id);
    }
  }, [session?.user, workspaces, workspaceId]);

  const currentWorkspace = workspaceId
    ? workspaces.find((w) => w.id === workspaceId) ?? workspaces[0] ?? null
    : workspaces[0] ?? null;
  const effectiveWorkspaceId = currentWorkspace?.id ?? workspaceId;

  return (
    <WorkspaceContext.Provider
      value={{
        workspaceId: effectiveWorkspaceId ?? null,
        workspace: currentWorkspace ?? null,
        workspaces,
        isLoading: !!session?.user && isLoadingWorkspaces,
        setWorkspaceId,
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
