"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { demoFrames, offerChangeSummary, suggestedResponse } from "./demoFrames";
import { cn } from "@offerpulse/lib/utils";

export function CheckoutRevealDemo() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const frame = demoFrames[currentFrame];

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Intersection Observer to play only when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animation loop
  useEffect(() => {
    if (prefersReducedMotion) {
      // Show final frame for reduced motion
      setCurrentFrame(3);
      return;
    }

    if (!isVisible) return;

    const timer = setTimeout(() => {
      setCurrentFrame((prev) => (prev + 1) % demoFrames.length);
    }, frame.duration * 1000);

    return () => clearTimeout(timer);
  }, [currentFrame, isVisible, prefersReducedMotion, frame.duration]);

  return (
    <div ref={sectionRef} className="relative">
      {/* Browser-like card */}
      <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-xl">
        {/* Browser header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <div className="flex items-center gap-2 rounded-md bg-white px-3 py-1">
              <svg className="h-3 w-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs text-slate-600">example-store.com</span>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            Example competitor checkout
          </Badge>
        </div>

        {/* Card body */}
        <div className="relative min-h-[400px] p-6 sm:p-8">
          {/* Monitoring badge */}
          <div className="absolute right-4 top-4">
            <Badge
              variant={frame.badge.type === "detected" ? "default" : "secondary"}
              className={cn(
                "text-xs",
                frame.badge.type === "detected" && "bg-green-600"
              )}
            >
              {frame.badge.text}
            </Badge>
          </div>

          {/* Content transitions */}
          <div className="space-y-6">
            {/* Product page view */}
            {frame.elements.productTitle && (
              <div className="transition-opacity duration-500">
                <h3 className="text-2xl font-bold text-slate-900">{frame.elements.productTitle}</h3>
                <p className="mt-2 text-3xl font-bold text-slate-900">{frame.elements.price}</p>
                {frame.elements.button && (
                  <button className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white">
                    {frame.elements.button}
                  </button>
                )}
              </div>
            )}

            {/* Cart/Checkout view */}
            {frame.elements.lineItems && (
              <div className="space-y-3">
                {frame.elements.lineItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex justify-between rounded-lg p-3 transition-all duration-500",
                      item.highlight && "relative bg-yellow-50 ring-2 ring-yellow-400"
                    )}
                  >
                    <span className="text-slate-700">{item.label}</span>
                    <span className="font-semibold text-slate-900">{item.value}</span>
                    
                    {/* Tooltip */}
                    {item.tooltip && (
                      <div className="absolute -top-12 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
                        {item.tooltip}
                        <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-900" />
                      </div>
                    )}
                  </div>
                ))}
                {frame.elements.button && (
                  <button className="mt-4 w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white">
                    {frame.elements.button}
                  </button>
                )}
              </div>
            )}

            {/* Offer stack */}
            {frame.elements.offers && (
              <div className="mt-6 space-y-2">
                <p className="text-sm font-semibold text-slate-600">Active offers:</p>
                {frame.elements.offers.map((offer, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "relative flex items-center gap-2 rounded-lg border p-3 transition-all duration-500",
                      offer.highlight ? "border-green-300 bg-green-50" : "border-slate-200 bg-slate-50"
                    )}
                    style={{ animationDelay: `${idx * 0.3}s` }}
                  >
                    <div className="h-2 w-2 rounded-full bg-green-600" />
                    <span className="text-sm text-slate-700">{offer.text}</span>
                    
                    {offer.tooltip && (
                      <span className="ml-auto text-xs font-medium text-green-700">{offer.tooltip}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Offer change summary panel */}
            {frame.elements.showSummary && (
              <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="mb-3 text-sm font-semibold text-blue-900">Offer change summary:</p>
                <div className="space-y-2">
                  {offerChangeSummary.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-blue-800">{item.change}</span>
                      <span className="font-semibold text-blue-900">{item.detail}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-lg bg-blue-100 px-3 py-2">
                  <p className="text-xs font-medium text-blue-900">
                    Suggested response: {suggestedResponse}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Frame indicator */}
      {!prefersReducedMotion && (
        <div className="mt-4 flex justify-center gap-2">
          {demoFrames.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-2 rounded-full transition-all",
                idx === currentFrame ? "w-8 bg-blue-600" : "w-2 bg-slate-300"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
