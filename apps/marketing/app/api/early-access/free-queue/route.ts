import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, competitorUrl, utmSource, utmMedium, utmCampaign } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // For now, log to console (replace with Supabase/DB in production)
    console.log("Free queue signup:", {
      email,
      competitorUrl,
      leadType: "free_queue",
      utmSource,
      utmMedium,
      utmCampaign,
      timestamp: new Date().toISOString(),
    });

    // TODO: Store in database
    // await supabase.from('early_access_leads').insert({...})

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Free queue error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
