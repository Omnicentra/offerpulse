"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { demoFrames, offerChangeSummary, suggestedResponse } from "./demoFrames";
import { cn } from "@offerpulse/lib/utils";

interface CursorPosition {
  x: number;
  y: number;
  click?: boolean;
}

const cursorPaths: CursorPosition[][] = [
  [{ x: 120, y: 200 }], // Frame 1: Near Add to cart
  [{ x: 120, y: 280 }], // Frame 2: Near Checkout  
  [{ x: 200, y: 160 }], // Frame 3: Near shipping line
  [{ x: 180, y: 300 }], // Frame 4: Near offer stack
];

export function CheckoutRevealDemo() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [progress, setProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  const frame = demoFrames[currentFrame];
  const cursorTarget = cursorPaths[currentFrame][0];

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Intersection Observer
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

  // Progress and frame animation
  useEffect(() => {
    if (prefersReducedMotion) {
      setCurrentFrame(3); // Show final frame
      return;
    }

    if (!isVisible || isPaused) {
      return;
    }

    const frameDuration = frame.duration * 1000;
    const progressInterval = 50; // Update progress every 50ms

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += progressInterval;
      setProgress((elapsed / frameDuration) * 100);

      if (elapsed >= frameDuration) {
        setCurrentFrame((prev) => (prev + 1) % demoFrames.length);
        setProgress(0);
      }
    }, progressInterval);

    return () => clearInterval(interval);
  }, [currentFrame, isVisible, isPaused, prefersReducedMotion, frame.duration]);

  const handleStepClick = (index: number) => {
    setCurrentFrame(index);
    setProgress(0);
  };

  return (
    <div
      ref={sectionRef}
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Browser-like card with FIXED height */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-xl">
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
            Example checkout
          </Badge>
        </div>

        {/* Fixed height card body */}
        <div className="relative h-[420px] overflow-hidden p-6 sm:p-8">
          {/* Monitoring badge - animated */}
          <motion.div
            className="absolute right-4 top-4 z-10"
            key={frame.badge.text}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Badge
              variant={frame.badge.type === "detected" ? "default" : "secondary"}
              className={cn("text-xs", frame.badge.type === "detected" && "bg-green-600")}
            >
              {frame.badge.text}
            </Badge>
          </motion.div>

          {/* Simulated cursor - hidden on mobile */}
          {!prefersReducedMotion && (
            <motion.div
              className="pointer-events-none absolute z-50 hidden sm:block"
              animate={{
                x: cursorTarget.x,
                y: cursorTarget.y,
              }}
              transition={{
                duration: 0.8,
                ease: "easeInOut",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                  fill="#3B82F6"
                  stroke="white"
                  strokeWidth="1.5"
                />
              </svg>
              {cursorTarget.click && (
                <motion.div
                  className="absolute -inset-2 rounded-full bg-blue-400"
                  initial={{ opacity: 0.6, scale: 1 }}
                  animate={{ opacity: 0, scale: 2 }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </motion.div>
          )}

          {/* Content - animated transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFrame}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* Product page view */}
              {frame.elements.productTitle && (
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{frame.elements.productTitle}</h3>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{frame.elements.price}</p>
                  {frame.elements.button && (
                    <motion.button
                      className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {frame.elements.button}
                    </motion.button>
                  )}
                </div>
              )}

              {/* Cart/Checkout view */}
              {frame.elements.lineItems && (
                <div className="space-y-3">
                  {frame.elements.lineItems.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={cn(
                        "relative flex justify-between rounded-lg p-3 transition-all",
                        item.highlight && "bg-yellow-50 ring-2 ring-yellow-400 shadow-lg"
                      )}
                    >
                      <span className="text-slate-700">{item.label}</span>
                      <span className="font-semibold text-slate-900">{item.value}</span>

                      {/* Animated tooltip */}
                      {item.tooltip && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="absolute -top-12 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
                        >
                          {item.tooltip}
                          <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-900" />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                  {frame.elements.button && (
                    <motion.button
                      className="mt-4 w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {frame.elements.button}
                    </motion.button>
                  )}
                </div>
              )}

              {/* Offer stack - staggered animation */}
              {frame.elements.offers && (
                <motion.div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-600">Active offers:</p>
                  {frame.elements.offers.map((offer, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.2 }}
                      className={cn(
                        "relative flex items-center gap-2 rounded-lg border p-3",
                        offer.highlight ? "border-green-300 bg-green-50" : "border-slate-200 bg-slate-50"
                      )}
                    >
                      <motion.div
                        className="h-2 w-2 rounded-full bg-green-600"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.2 + 0.1 }}
                      />
                      <span className="text-sm text-slate-700">{offer.text}</span>
                      {offer.tooltip && (
                        <span className="ml-auto text-xs font-medium text-green-700">{offer.tooltip}</span>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Offer change summary panel - only in frame 4, positioned absolutely */}
              {frame.elements.showSummary && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="absolute bottom-6 left-6 right-6 rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-lg"
                >
                  <p className="mb-3 text-sm font-semibold text-blue-900">Offer change summary:</p>
                  <div className="space-y-2">
                    {offerChangeSummary.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 + idx * 0.1 }}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-blue-800">{item.change}</span>
                        <span className="font-semibold text-blue-900">{item.detail}</span>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-lg bg-blue-100 px-3 py-2">
                    <p className="text-xs font-medium text-blue-900">
                      Suggested: {suggestedResponse}
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Progress bar with step indicators */}
      {!prefersReducedMotion && (
        <div className="mt-6">
          {/* Step pills */}
          <div className="mb-3 flex justify-center gap-2">
            {demoFrames.map((f, idx) => (
              <button
                key={idx}
                onClick={() => handleStepClick(idx)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-all",
                  idx === currentFrame
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                )}
                aria-label={`Go to step ${idx + 1}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
            <motion.div
              className="h-full bg-blue-600"
              style={{
                width: `${((currentFrame + progress / 100) / demoFrames.length) * 100}%`,
              }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Pause hint */}
          <p className="mt-2 text-center text-xs text-slate-500">
            {isPaused ? "Paused - move mouse away to continue" : "Hover to pause"}
          </p>
        </div>
      )}
    </div>
  );
}
