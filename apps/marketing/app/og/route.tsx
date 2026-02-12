import { ImageResponse } from "next/og";
import { SITE_CONFIG } from "@/lib/seo/config";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || SITE_CONFIG.defaultTitle;
  const subtitle = searchParams.get("subtitle") || "";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)",
          padding: "60px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            position: "absolute",
            top: 50,
            left: 60,
            display: "flex",
            alignItems: "center",
            gap: 15,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: 40,
                color: "white",
              }}
            >
              ⚡
            </div>
          </div>
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#0F172A",
            }}
          >
            OfferPulse
          </span>
        </div>

        {/* Main Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            maxWidth: 1000,
          }}
        >
          <h1
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#0F172A",
              lineHeight: 1.1,
              margin: 0,
              marginBottom: subtitle ? 20 : 40,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: 32,
                color: "#475569",
                margin: 0,
                marginBottom: 40,
              }}
            >
              {subtitle}
            </p>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
              color: "white",
              fontSize: 24,
              fontWeight: 600,
              padding: "16px 32px",
              borderRadius: 12,
            }}
          >
            Generate free snapshot
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
