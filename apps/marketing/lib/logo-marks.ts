/**
 * OfferPulse logo marks — improved, dynamic icon system
 * Concept: Dynamic lightning bolt = instant competitive alerts
 * 
 * V2 improvements:
 * - More dynamic, angular bolt shape
 * - Better proportions and balance
 * - Enhanced signal waves and effects
 * - Optimized for all sizes (16px - 512px)
 */

const SVG_ATTRS =
  'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

/** Improved bolt: more dynamic, angular, better balanced */
const BOLT = "M13 2 L4 13 L10.5 13 L8 22 L20 9 L13.5 9 Z";

// -----------------------------------------------------------------------------
// Variant 1: Pulse - radiating waves (radar ping style)
// -----------------------------------------------------------------------------
export const LOGO_MARK_PULSE = `<svg ${SVG_ATTRS}>
  <path d="M12 4 C7.58 4 4 7.58 4 12 C4 16.42 7.58 20 12 20" opacity="0.2" stroke-dasharray="3 2"/>
  <path d="M12 7 C9.24 7 7 9.24 7 12 C7 14.76 9.24 17 12 17" opacity="0.4" stroke-dasharray="2 1"/>
  <path d="${BOLT}" fill="currentColor" stroke="none"/>
</svg>`;

// -----------------------------------------------------------------------------
// Variant 2: Broadcast - signal waves (Wi-Fi style)
// -----------------------------------------------------------------------------
export const LOGO_MARK_BROADCAST = `<svg ${SVG_ATTRS}>
  <path d="${BOLT}" fill="currentColor" stroke="none"/>
  <path d="M14.5 7 Q17 5.5 19 7.5" opacity="0.6" stroke-width="1.5"/>
  <path d="M15 11 Q18 10 20.5 12" opacity="0.5" stroke-width="1.5"/>
  <path d="M14.5 15 Q17 13.5 19 15.5" opacity="0.4" stroke-width="1.5"/>
</svg>`;

// -----------------------------------------------------------------------------
// Variant 3: Minimal - just the bolt (for favicons/small sizes)
// -----------------------------------------------------------------------------
export const LOGO_MARK_MINIMAL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path d="${BOLT}"/>
</svg>`;

// -----------------------------------------------------------------------------
// Variant 4: Signal - strength indicator bars
// -----------------------------------------------------------------------------
export const LOGO_MARK_SIGNAL = `<svg ${SVG_ATTRS}>
  <path d="${BOLT}" fill="currentColor" stroke="none"/>
  <rect x="16" y="15" width="1.5" height="4" rx="0.5" opacity="0.3"/>
  <rect x="18.5" y="13" width="1.5" height="6" rx="0.5" opacity="0.5"/>
  <rect x="21" y="10" width="1.5" height="9" rx="0.5" opacity="0.7"/>
</svg>`;

// -----------------------------------------------------------------------------
// App icon: Premium treatment with gradient, depth, and effects
// -----------------------------------------------------------------------------
export const APP_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <defs>
    <linearGradient id="app-bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#635BFF"/>
      <stop offset="50%" stop-color="#7C6FFF"/>
      <stop offset="100%" stop-color="#2FE4AB"/>
    </linearGradient>
    <radialGradient id="app-glow" cx="50%" cy="50%">
      <stop offset="0%" stop-color="white" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </radialGradient>
    <filter id="app-shadow">
      <feGaussianBlur in="SourceAlpha" stdDeviation="0.5"/>
      <feOffset dx="0" dy="1"/>
    </filter>
  </defs>
  
  <rect width="24" height="24" rx="5.5" fill="url(#app-bg-gradient)"/>
  <rect width="24" height="24" rx="5.5" fill="url(#app-glow)"/>
  
  <g filter="url(#app-shadow)">
    <path d="${BOLT}" fill="white" opacity="0.95"/>
  </g>
  
  <path d="M12 6 C8.69 6 6 8.69 6 12 C6 15.31 8.69 18 12 18" 
        stroke="white" stroke-width="1.5" fill="none" opacity="0.15" stroke-dasharray="2 3"/>
</svg>`;
