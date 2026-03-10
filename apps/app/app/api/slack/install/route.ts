import { NextRequest } from "next/server";
import { env } from "@/env";

export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id");

  const params = new URLSearchParams({
    client_id: env.SLACK_CLIENT_ID,
    scope: "chat:write,chat:write.public,channels:read,groups:read",
    redirect_uri: `${env.NEXT_PUBLIC_DASHBOARD_APP_URL}/api/slack/callback`,
    state: workspaceId ?? "",
  });

  return Response.redirect(
    `https://slack.com/oauth/v2/authorize?${params.toString()}`
  );
}
