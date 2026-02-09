/**
 * Icon Showcase - Visual reference for all OfferPulse icon variants
 * Use this component in Storybook or a /design-system page
 */

import { LogoMark, AppIcon } from "./logo-mark"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

export function IconShowcase() {
  return (
    <div className="space-y-12 p-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">OfferPulse Icon System v2.0</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Complete icon system with improved proportions and professional polish
        </p>
      </div>

      {/* Variants Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Pulse */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pulse (Default)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10">
                <LogoMark variant="pulse" size={32} className="text-primary" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Main logo, monitoring contexts
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Broadcast */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Broadcast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-secondary/10">
                <LogoMark variant="broadcast" size={32} className="text-secondary" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Marketing, alerts, communications
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Minimal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Minimal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-accent/10">
                <LogoMark variant="minimal" size={32} className="text-accent" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Favicons, small UI, navigation
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Signal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-muted">
                <LogoMark variant="signal" size={32} className="text-foreground" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Activity, strength indicators
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Size Comparison */}
      <div>
        <h2 className="mb-6 text-2xl font-bold">Size Scale</h2>
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-wrap items-end gap-8">
              <div className="flex flex-col items-center gap-2">
                <LogoMark variant="minimal" size={16} className="text-primary" />
                <span className="text-xs text-muted-foreground">16px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <LogoMark variant="minimal" size={20} className="text-primary" />
                <span className="text-xs text-muted-foreground">20px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <LogoMark variant="pulse" size={24} className="text-primary" />
                <span className="text-xs text-muted-foreground">24px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <LogoMark variant="broadcast" size={32} className="text-primary" />
                <span className="text-xs text-muted-foreground">32px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <AppIcon size={64} />
                <span className="text-xs text-muted-foreground">64px</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* App Icon Showcase */}
      <div>
        <h2 className="mb-6 text-2xl font-bold">App Icon</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Default</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <AppIcon size={128} />
                <p className="text-center text-sm text-muted-foreground">
                  Full gradient with depth
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted">
            <CardHeader>
              <CardTitle className="text-base">On Dark</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <AppIcon size={128} variant="dark" />
                <p className="text-center text-sm text-muted-foreground">
                  Optimized for dark backgrounds
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base">On Light</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <AppIcon size={128} variant="light" />
                <p className="text-center text-sm text-muted-foreground">
                  Optimized for light backgrounds
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Animation Demo */}
      <div>
        <h2 className="mb-6 text-2xl font-bold">Animation</h2>
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-around">
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10">
                  <LogoMark variant="pulse" size={32} className="text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Static</span>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10">
                  <LogoMark 
                    variant="pulse" 
                    size={32} 
                    animated 
                    className="text-primary" 
                  />
                </div>
                <span className="text-sm text-muted-foreground">Animated</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Color Variations */}
      <div>
        <h2 className="mb-6 text-2xl font-bold">Color Variations</h2>
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-wrap items-center justify-around gap-8">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                  <LogoMark variant="minimal" size={24} className="text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Primary</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary/10">
                  <LogoMark variant="minimal" size={24} className="text-secondary" />
                </div>
                <span className="text-xs text-muted-foreground">Secondary</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10">
                  <LogoMark variant="minimal" size={24} className="text-accent" />
                </div>
                <span className="text-xs text-muted-foreground">Accent</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
                  <LogoMark variant="minimal" size={24} className="text-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">Foreground</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-foreground">
                  <LogoMark variant="minimal" size={24} className="text-background" />
                </div>
                <span className="text-xs text-muted-foreground">White</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Examples */}
      <div>
        <h2 className="mb-6 text-2xl font-bold">Real-World Examples</h2>
        <div className="space-y-4">
          {/* Navbar example */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Navbar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/90 shadow-sm">
                    <LogoMark variant="minimal" size={20} className="text-white" />
                  </div>
                  <span className="font-semibold">OfferPulse</span>
                </div>
                <div className="text-sm text-muted-foreground">Navigation items...</div>
              </div>
            </CardContent>
          </Card>

          {/* Loading state */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Loading State</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <LogoMark variant="pulse" size={24} animated className="text-primary" />
                <span className="text-sm text-muted-foreground">
                  Analyzing competitor offers...
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Hero section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Hero Section</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative inline-flex">
                <div className="absolute inset-0 bg-primary/20 blur-2xl" />
                <LogoMark variant="broadcast" size={32} className="relative text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
