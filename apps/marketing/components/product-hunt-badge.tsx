"use client"

import { track } from "@/lib/analytics"
import Image from "next/image"

type ProductHuntBadgeProps = {
  placement?: "footer" | "hero"
}

export function ProductHuntBadge({ placement = "footer" }: ProductHuntBadgeProps) {
  return (
    <a
      href="https://www.producthunt.com/products/offer-pulse?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-offer-pulse"
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-block shrink-0 rounded-xl outline-none ring-offset-background transition duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-safe:hover:scale-[1.02] motion-safe:hover:opacity-95"
      onClick={() => track("product_hunt_badge_clicked", { placement })}
    >
      <Image
        alt="Offer Pulse - Track competitor offers on Shopify. Get free snapshot! | Product Hunt"
        width={250}
        height={54}
        unoptimized
        src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1085975&theme=light&t=1776933499761"
        className="h-[54px] w-[250px] max-w-full select-none drop-shadow-sm"
      />
    </a>
  )
}
