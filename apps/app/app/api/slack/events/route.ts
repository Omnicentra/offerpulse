import { NextResponse } from "next/server";
import { logger } from "@offerpulse/lib";

/**
 * Slack Events API endpoint for event subscriptions.
 * Used when configuring the Events API Request URL in your Slack app.
 *
 * @see https://docs.slack.dev/reference/events/url_verification
 */
export async function POST(req: Request) {
  let body: { type?: string; challenge?: string; token?: string };

  try {
    body = await req.json();
    logger.debug("Slack events API request body", body);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (body.type === "url_verification") {
    const challenge = body.challenge;
    if (typeof challenge !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid challenge" },
        { status: 400 }
      );
    }
    return NextResponse.json({ challenge }, { status: 200 });
  }

  // Other event types (e.g. event_callback) can be handled here later
  return NextResponse.json({ ok: true }, { status: 200 });
}
