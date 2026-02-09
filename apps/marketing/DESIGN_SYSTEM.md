# OfferPulse Design System

## Color Palette

### Primary Colors
```css
--primary: 243 100% 66%        /* #635BFF - Indigo */
--secondary: 160 76% 54%       /* #2FE4AB - Mint */
--accent: 32 100% 71%          /* #FFB86B - Warm glow */
```

### Neutrals
```css
--bg: 240 20% 99%              /* #FBFBFD - Soft background */
--surface: 0 0% 100%           /* #FFFFFF - Pure white */
--ink: 216 49% 8%              /* #0B1220 - Deep text */
--muted: 219 19% 41%           /* #52607A - Muted text */
--border: 220 25% 93%          /* #E7ECF4 - Subtle borders */
```

### Semantic
```css
--success: 160 76% 54%         /* Same as secondary */
--warning: 32 100% 71%         /* Same as accent */
--destructive: 0 84% 60%       /* Error states */
```

---

## Typography Scale

### Headings
```tsx
<Heading as="h1">         // 4xl → 5xl → 6xl (48px → 60px → 72px)
<Heading as="h2">         // 3xl → 4xl → 5xl (36px → 48px → 60px)
<Heading as="h3">         // 2xl → 3xl → 4xl (24px → 36px → 48px)
<Heading gradient>        // Adds gradient effect
```

### Body Text
```tsx
<Subheading size="lg">    // lg → xl → 2xl (18px → 20px → 24px)
<Subheading>              // base → lg (16px → 18px)
<p className="text-base"> // Default body (16px)
<p className="text-sm">   // Small text (14px)
<p className="text-xs">   // Micro text (12px)
```

---

## Spacing System

### Container Padding
```tsx
<Container>               // px-4 sm:px-6 lg:px-8
```

### Section Spacing
```tsx
<Section>                 // py-16 sm:py-20 lg:py-24
```

### Component Gaps
- Cards grid: `gap-6`
- Form elements: `gap-3`
- Icon + text: `gap-2`
- Navigation: `gap-8`

---

## Border Radius

```css
rounded-sm      // 0.125rem (2px)
rounded-md      // 0.375rem (6px)
rounded-lg      // 0.5rem (8px)
rounded-xl      // 0.75rem (12px)  ← Buttons, inputs
rounded-2xl     // 1rem (16px)     ← Cards
rounded-3xl     // 1.5rem (24px)
rounded-full    // 9999px          ← Badges
```

---

## Shadows

### Utility Classes
```css
.shadow-soft      // Subtle card shadow
.shadow-soft-lg   // Elevated card shadow
.shadow-glow      // Primary button glow
```

### Custom
```tsx
// Buttons
hover:shadow-glow

// Cards
shadow-soft hover:shadow-soft-lg

// Premium cards
border-2 border-primary/40 shadow-glow
```

---

## Button Variants

### Sizes
```tsx
<Button size="sm">   // h-9 (36px)
<Button size="default"> // h-10 (40px)
<Button size="lg">   // h-12 (48px)
<Button size="icon"> // h-10 w-10
```

### Variants
```tsx
<Button variant="default">    // Primary (indigo bg)
<Button variant="outline">    // Outlined
<Button variant="secondary">  // Mint bg
<Button variant="ghost">      // Transparent
<Button variant="destructive"> // Error state
<Button variant="link">       // Text link
```

### States
- **Hover**: `-translate-y-0.5` + `shadow-glow`
- **Active**: `scale-[0.98]`
- **Focus**: `ring-2 ring-primary`

---

## Card Patterns

### Default Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
  <CardFooter>
    Actions
  </CardFooter>
</Card>
```

### Interactive Card
```tsx
<Card className="card-interactive">
  // Includes shimmer effect on hover
</Card>
```

### Highlighted Card
```tsx
<Card className="border-2 border-primary/40 shadow-glow">
  // For featured/popular items
</Card>
```

---

## Input States

### Default
```css
border-input bg-background
```

### Hover
```css
hover:border-primary/50
```

### Focus
```css
focus:border-primary focus:ring-2 focus:ring-primary/20
```

### Disabled
```css
disabled:opacity-50 disabled:cursor-not-allowed
```

---

## Animation Patterns

### Hover Lift
```css
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 91, 255, 0.15);
}
```

### Button Press
```css
active:scale-[0.98]
```

### Link Underline
```tsx
<Link className="link-underline">
  // Animated underline on hover
</Link>
```

### Keyframe Animations
```css
@keyframes float        // 3s ease-in-out
@keyframes glow-pulse   // 2s ease-in-out
@keyframes shimmer      // Background position
```

---

## Icon Patterns

### With Text
```tsx
<CheckCircle className="h-4 w-4 text-secondary" />
<span>Text here</span>
```

### In Circle Background
```tsx
<div className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary/20">
  <CheckCircle className="h-3.5 w-3.5 text-secondary" />
</div>
```

### Sizes
- Small: `h-4 w-4` (16px)
- Default: `h-5 w-5` (20px)
- Medium: `h-6 w-6` (24px)
- Large: `h-8 w-8` (32px)

---

## Badge Patterns

### Pill Badge
```tsx
<Badge className="badge-pill border-primary/20 bg-primary/10 text-primary">
  Early Access
</Badge>
```

### With Indicator
```tsx
<Badge>
  <span className="relative flex h-2 w-2">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
  </span>
  Live
</Badge>
```

---

## Gradient Utilities

### Hero Gradient
```css
.heroGlow {
  background: linear-gradient(
    135deg,
    rgba(99, 91, 255, 0.18),
    rgba(47, 228, 171, 0.12),
    rgba(255, 184, 107, 0.1)
  );
}
```

### Text Gradient
```css
bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent
```

### Button Gradient (for CTAs)
```css
bg-gradient-to-r from-primary to-primary/90
```

---

## Responsive Breakpoints

```css
sm: 640px   // Tablet
md: 768px   // Small laptop
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
2xl: 1536px // Extra large
```

### Usage Pattern
```tsx
className="text-base sm:text-lg lg:text-xl"  // Mobile → Tablet → Desktop
```

---

## Touch Targets (Mobile)

### Minimum Sizes
- Buttons: `h-14` (56px) on mobile
- Inputs: `h-14` (56px) on mobile
- Links: `min-h-[44px]` (Apple/Android guidelines)
- Tab triggers: `min-h-[44px]`

### Implementation
```tsx
<Button className="h-14 sm:h-12">
  // 56px on mobile, 48px on desktop
</Button>
```

---

## Accessibility

### Focus States
```css
*:focus-visible {
  outline: none;
  ring: 2px ring-primary ring-offset-2;
}
```

### ARIA Labels
```tsx
<button aria-label="Close menu">
<nav aria-label="Main navigation">
<main id="main-content">
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Component Checklist

When creating new components, ensure:

✅ Proper TypeScript interfaces  
✅ Responsive sizing (mobile-first)  
✅ Touch targets ≥44px on mobile  
✅ Focus states for keyboard nav  
✅ ARIA labels where needed  
✅ Hover states with transitions  
✅ Consistent border radius  
✅ Proper spacing (Tailwind scale)  
✅ Semantic HTML elements  
✅ Reduced motion support  

---

## Logo Usage

### Variants
1. **Radar**: Bolt + 2 concentric rings (recommended for app)
2. **Broadcast**: Bolt + 3 curved rays (recommended for marketing)
3. **Tag**: Bolt in price tag (for e-commerce context)

### Sizes
```tsx
<LogoMark variant="broadcast" size={16} />
<LogoMark variant="broadcast" size={20} />
<LogoMark variant="broadcast" size={24} />
```

### App Icon
```tsx
<AppIcon size={24} />  // Rounded rect with gradient
```

---

## Quick Reference: Common Patterns

### Hero Section
- Badge with social proof → Large gradient headline → Subheading (size="lg") → Benefit bullets → CTA form → Trust signals

### Section Header
- Badge → Heading (as="h2") → Subheading → Content

### Card Grid
- `grid gap-6 sm:grid-cols-2 lg:grid-cols-3`

### Two-Column Layout
- `grid gap-12 lg:grid-cols-2 lg:gap-16`

### CTA Pattern
- Primary button (lg) + Outline button + Trust line below

---

This design system ensures consistency, accessibility, and premium polish across the entire OfferPulse website.
