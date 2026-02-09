"use client";

import Image from "next/image";

const logos = [
  { name: "Shopify", src: "/logos/shopify.svg" },
  { name: "Klaviyo", src: "/logos/klaviyo.svg" },
  { name: "Meta", src: "/logos/meta.svg" },
  { name: "Google", src: "/logos/google.svg" },
  { name: "Gorgias", src: "/logos/gorgias.svg" },
  { name: "Recharge", src: "/logos/recharge.svg" },
  { name: "TikTok", src: "/logos/tiktok.svg" },
  { name: "Attentive", src: "/logos/attentive.svg" },
];

/**
 * Infinite scrolling logo marquee
 * Shows brand logos with grayscale → color hover effect
 */
export function LogoMarquee() {
  // Duplicate for seamless loop
  const duplicatedLogos = [...logos, ...logos];

  return (
    <div className="relative overflow-hidden py-8">
      {/* Gradient fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-muted/30 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-muted/30 to-transparent" />

      {/* Scrolling container */}
      <div className="flex animate-marquee gap-16">
        {duplicatedLogos.map((logo, index) => (
          <div
            key={`${logo.name}-${index}`}
            className="group flex h-10 w-28 shrink-0 items-center justify-center transition-all duration-300 grayscale hover:grayscale-0"
            style={{ opacity: 0.35 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.35";
            }}
          >
            {/* TODO: Replace with actual logo images */}
            <div className="flex h-full w-full items-center justify-center rounded-lg bg-surface px-3 shadow-sm">
              <span className="text-xs font-semibold text-body/60">
                {logo.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
