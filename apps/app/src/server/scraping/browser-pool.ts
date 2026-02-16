import { chromium, Browser, BrowserContext } from "playwright";

/**
 * Simple browser pool manager for efficient browser reuse
 * Maintains a pool of browser contexts to avoid repeated launches
 */
class BrowserPool {
  private browser: Browser | null = null;
  private contexts: BrowserContext[] = [];
  private maxContexts = 5;
  private isShuttingDown = false;

  async getBrowser(): Promise<Browser> {
    if (this.isShuttingDown) {
      throw new Error("Browser pool is shutting down");
    }

    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
        ],
      });
    }

    return this.browser;
  }

  async getContext(): Promise<BrowserContext> {
    if (this.isShuttingDown) {
      throw new Error("Browser pool is shutting down");
    }

    // Clean up closed contexts
    this.contexts = this.contexts.filter((ctx) => !ctx.browser()?.isConnected());

    // Reuse existing context if available
    if (this.contexts.length < this.maxContexts) {
      const browser = await this.getBrowser();
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        locale: "en-GB",
        timezoneId: "Europe/London",
      });

      this.contexts.push(context);
      return context;
    }

    // Return least recently used context
    return this.contexts[0];
  }

  async releaseContext(context: BrowserContext) {
    try {
      await context.close();
      this.contexts = this.contexts.filter((ctx) => ctx !== context);
    } catch (error) {
      console.error("Error releasing browser context:", error);
    }
  }

  async shutdown() {
    this.isShuttingDown = true;

    // Close all contexts
    await Promise.all(
      this.contexts.map((ctx) =>
        ctx.close().catch((err) => console.error("Error closing context:", err))
      )
    );

    // Close browser
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    this.contexts = [];
    this.isShuttingDown = false;
  }
}

// Export singleton instance
export const browserPool = new BrowserPool();

// Graceful shutdown on process termination
process.on("SIGTERM", async () => {
  await browserPool.shutdown();
});

process.on("SIGINT", async () => {
  await browserPool.shutdown();
});
