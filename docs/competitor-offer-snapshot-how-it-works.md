# How the Competitor Offer Snapshot Tool Works

*A plain-language guide for non-technical readers*

---

## What the tool does (in one sentence)

When someone enters a competitor’s store URL (e.g. `https://example-store.com`), the tool **visits that page like a real browser**, **takes a screenshot**, **reads all the visible offers** (shipping, discounts, bundles, etc.), and **builds a report** with a score, a list of offers, and a screenshot—all in a few seconds.

---

## The big picture: what happens step by step

1. **User enters a URL** on the Offer Snapshot tool page and clicks “Scan” (or lands with a URL in the link for a pre-filled scan).

2. **Our server checks** that the URL is valid and that the user hasn’t hit the rate limit. We use **Upstash Redis** to limit how many scans each visitor can do (e.g. 5 scans per 15 minutes per IP). This keeps the tool fair and sustainable; responses include standard rate-limit headers so clients can show remaining requests and when the limit resets.

3. **We “visit” the store** using **Firecrawl**. Firecrawl loads the page like a real browser (including JavaScript) and returns the rendered HTML and a screenshot. That way we see what a real visitor sees—banners, promo bars, and offers—not an empty or half-loaded page.

4. **We capture two things:**
   - The **fully rendered HTML** (the page structure and text after everything has loaded).
   - A **full-page screenshot** of the store (from Firecrawl, or we upload our own to R2 when needed).

5. **We upload the screenshot** (if not already from Firecrawl) to our own storage (Cloudflare R2). That gives us a permanent, public link to the image so we can show it in the report (“Site Screenshot” section) and in shareable links.

6. **We analyze the page text** with our “extractor.” It doesn’t use AI for this step—it uses predefined patterns (like “free shipping over £50” or “20% off with code SAVE20”) to find:
   - Shipping thresholds (e.g. free delivery over $75)
   - Discounts (percent off, fixed amount off, promo codes)
   - Bundles (e.g. “Buy 2 get 1 free”, “3 for 2”)
   - Gifts (e.g. “Free gift with orders over £40”)
   - Cart incentives (e.g. “You’re £10 away from free shipping”)
   - Announcement bar / banner text

7. **We score the offers** using simple rules (e.g. “has a shipping threshold” = +15, “has discounts” = +15, “has multiple types of offers” = stacking bonus). The result is a 0–100 score and a grade (e.g. A, B+).

8. **We build the report:** score, grade, list of offers by category, the screenshot, and short recommendations (e.g. “Match competitor’s free shipping threshold”).

9. **We send the result** back to the user’s browser. The tool page then displays the report (score ring, metrics, offer stack, screenshot, recommendations). We do not cache results; each scan is a fresh run. Rate limiting (via Upstash Redis) is the only shared state we use to control usage.

---

## Who does what (services we use)

- **Upstash Redis**  
  We use it **only for rate limiting**. Each request is checked against a sliding-window limit (e.g. 5 requests per 15 minutes per IP). There is no result cache; we rely on a single source of truth (Redis) for usage control. Responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.

- **Firecrawl**  
  A “browser in the cloud.” We send it the store URL; it loads the page with a real browser engine (including JavaScript), then sends us back the rendered HTML and a screenshot. This is the same approach used by the dashboard app’s snapshot capture, so behavior is consistent across marketing and app.

- **Cloudflare R2**  
  Object storage (like S3). We upload screenshots there when needed and get back a public URL (e.g. `https://screenshots.offerpulse.io/snapshots/example-store-1234567890.png`). The report uses that URL to show the “Site Screenshot” and allow full-size view. We don’t store sensitive data—only public store screenshots.

- **Our own API and pages**  
  The marketing site hosts the tool page and API routes (e.g. `/api/tools/offer-snapshot`, `/api/tools/offer-clarity-check`). Each route: checks rate limit (Upstash) → calls Firecrawl (and R2 when needed) → runs the extractor → scores → returns the result. No in-memory or separate cache; every scan is a fresh run.

---

## How we “read” the offers (no AI in the snapshot itself)

The **extractor** is a set of rules and patterns that run over the page text:

- It knows where to look: announcement bars, header, hero banners, navigation, footer, and general page content (many stores use common CSS class names we look for).
- It searches for phrases like “free shipping over £50”, “20% off”, “use code SAVE20”, “buy 2 get 1 free”, “free gift with orders over $40”, “you’re $10 away from free shipping”, etc., in multiple currencies (£, $, €, A$, and others).
- For each match it keeps the **exact phrase** (evidence) and a **location hint** (e.g. “Announcement bar”, “Header”) so the report can show “what we found” and “where we found it.”

So the snapshot tool itself does **pattern matching**, not AI. The only place we use an AI service (OpenRouter) is in the **Offer Clarity Check** variant of the tool, which suggests improvements based on the same extracted data.

---

## How the score is calculated

The score (0–100) is **deterministic**: same page always gives the same score.

- **Discounts** (e.g. % off, codes): up to 15 points  
- **Shipping threshold** (e.g. free delivery over $X): up to 15 points  
- **Bundles** (e.g. BOGO, multi-buy): up to 12 points  
- **Gifts** (e.g. free gift with purchase): up to 12 points  
- **Cart incentives** (e.g. “add $X more to unlock”): up to 12 points  
- **Stacking bonus**: extra points (e.g. +10) when the store has several of the above at once  

The total is capped at 100, then converted to a grade (A+, A, A-, B+, etc.) and a confidence level based on how much we found.

---

## Summary diagram (flow)

```
User enters URL
       ↓
Rate limit check (Upstash Redis) → if over limit: 429 + reset time
       ↓
Firecrawl: load page in real browser → get HTML + screenshot
       ↓
Upload screenshot to R2 if needed → get public URL
       ↓
Extractor: scan HTML for offers (patterns, no AI)
       ↓
Scoring: compute 0–100 + grade
       ↓
Return report (score, offers, screenshot URL, recommendations) + rate limit headers
       ↓
Tool page displays report
```

---

## Optional: where this was implemented

This behavior was implemented according to the **Snapshot Tool Implementation** plan (see the plan file and the related agent transcript for the full technical history). The main pieces are:

- **Rate limiting** (Upstash Redis): single source of truth for usage control; no result cache.  
- **Scraper** (Firecrawl): loads the store and returns HTML + screenshot (aligned with the dashboard app).  
- **Extractor**: finds offers in the HTML using patterns.  
- **Scoring**: turns extracted offers into a 0–100 score and grade.  
- **API routes**: rate limit (Upstash) → Firecrawl (and R2 when needed) → extract → score → respond.  
- **Tool page**: form, progress, report (score, metrics, offer stack, screenshot, recommendations).

If you want more detail on any single step (e.g. “exactly which phrases we look for” or “how the screenshot gets from Firecrawl to the report”), we can add a short section for that next.
