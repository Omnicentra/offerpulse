import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, competitorUrl, utmSource, utmMedium, utmCampaign } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Log to console
    console.log("Free queue signup:", {
      email,
      competitorUrl,
      leadType: "free_queue",
      utmSource,
      utmMedium,
      utmCampaign,
      timestamp: new Date().toISOString(),
    });

    try {
      // Save to Airtable
      const { createWaitlistRecord } = await import("@/lib/airtable");
      await createWaitlistRecord({
        email,
        signupDate: new Date().toISOString().split("T")[0],
        status: "Waiting",
        competitorUrl,
        utmSource,
        utmMedium,
        utmCampaign,
      });

      console.log(`Saved waitlist signup to Airtable for ${email}`);
    } catch (error) {
      console.error("Failed to save to Airtable:", error);
      // Don't fail the request if Airtable save fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Free queue error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
