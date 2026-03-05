import { NextResponse } from "next/server";
import { logger } from "@offerpulse/lib";

/**
 * Slack Interactivity & Shortcuts endpoint.
 * Configure this as the Request URL under Interactivity & Shortcuts in your Slack app.
 * Receives payloads when users use interactive components (buttons, menus, etc.)
 * or shortcuts. Must respond with 200 OK within 3 seconds to acknowledge.
 *
 * @see https://docs.slack.dev/messaging/creating-interactive-messages/#components
 * @see https://api.slack.com/interactivity/handling
 */
export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";

  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return NextResponse.json(
      { error: "Expected application/x-www-form-urlencoded" },
      { status: 400 }
    );
  }

  let payloadRaw: string | null = null;

  try {
    const formData = await req.formData();
    const value = formData.get("payload");
    payloadRaw = typeof value === "string" ? value : null;
  } catch {
    return NextResponse.json(
      { error: "Failed to parse form body" },
      { status: 400 }
    );
  }

  if (!payloadRaw) {
    return NextResponse.json(
      { error: "Missing payload parameter" },
      { status: 400 }
    );
  }

  let payload: { type?: string };

  try {
    payload = JSON.parse(payloadRaw) as { type?: string };
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in payload" },
      { status: 400 }
    );
  }

  logger.debug("Slack interaction received", {
    type: payload.type,
  });

  // Required: acknowledge within 3 seconds with 200 OK.
  // Optional: return a message payload to update the message or open a modal;
  // for now we only acknowledge.
  return new NextResponse(null, { status: 200 });
}
