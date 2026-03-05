import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { env } from "@/env";
import { db } from "@/src/server/db";
import { alertSettings } from "@/src/server/db/schema";
import { eq } from "drizzle-orm";

const redirectUrl = (path: string, params?: Record<string, string>) => {
  const base = `${env.NEXT_PUBLIC_DASHBOARD_APP_URL}${path}`;
  if (params) {
    const search = new URLSearchParams(params).toString();
    return `${base}?${search}`;
  }
  return base;
};

const defaultEventTypes = [
  "PROMO",
  "SHIPPING",
  "BUNDLE",
  "CART_INCENTIVE",
  "DELIVERY_RETURNS",
];

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state"); // workspaceId

  if (!code || !state) {
    return Response.redirect(
      redirectUrl("/alerts", { error: "oauth_failed" })
    );
  }

  const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.SLACK_CLIENT_ID,
      client_secret: env.SLACK_CLIENT_SECRET,
      code,
      redirect_uri: `${env.NEXT_PUBLIC_DASHBOARD_APP_URL}/api/slack/callback`,
    }),
  });

  const data = (await tokenResponse.json()) as {
    ok?: boolean;
    access_token?: string;
    team?: { id?: string; name?: string };
    bot_user_id?: string;
  };

  if (!data.ok || !data.access_token) {
    return Response.redirect(
      redirectUrl("/alerts", { error: "oauth_failed" })
    );
  }

  const existing = await db.query.alertSettings.findFirst({
    where: eq(alertSettings.workspaceId, state),
  });

  if (existing) {
    await db
      .update(alertSettings)
      .set({
        slackAccessToken: data.access_token,
        slackTeamId: data.team?.id ?? null,
        slackTeamName: data.team?.name ?? null,
        slackBotUserId: data.bot_user_id ?? null,
        slackEnabled: true,
      })
      .where(eq(alertSettings.workspaceId, state));
  } else {
    await db.insert(alertSettings).values({
      id: `alert_${nanoid()}`,
      workspaceId: state,
      emailEnabled: true,
      slackEnabled: true,
      slackAccessToken: data.access_token,
      slackTeamId: data.team?.id ?? null,
      slackTeamName: data.team?.name ?? null,
      slackBotUserId: data.bot_user_id ?? null,
      eventTypes: defaultEventTypes,
      minConfidence: "medium",
    });
  }

  return Response.redirect(
    redirectUrl("/alerts", { slack_connected: "true" })
  );
}
