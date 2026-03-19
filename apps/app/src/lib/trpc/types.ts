import type { RouterOutputs } from "@/src/server/trpc/routers/root";

export type WorkspaceSettingsRow = RouterOutputs["workspaceSettings"]["get"];
export type UserProfile = RouterOutputs["users"]["getProfile"];
export type OwnStore = RouterOutputs["ownStore"]["get"];
export type Members = RouterOutputs["users"]["list"];
