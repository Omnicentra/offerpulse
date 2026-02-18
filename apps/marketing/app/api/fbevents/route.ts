import { NextResponse } from "next/server";

export const runtime = "edge";

// Cache the script for 1 hour
export async function GET() {
  try {
    const response = await fetch(
      "https://connect.facebook.net/en_US/fbevents.js",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch fbevents.js: ${response.status}`);
    }

    const script = await response.text();

    return new NextResponse(script, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error proxying fbevents.js:", error);
    return new NextResponse("// Facebook Pixel proxy error", {
      status: 500,
      headers: {
        "Content-Type": "application/javascript",
      },
    });
  }
}
