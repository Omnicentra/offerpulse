# How the Competitor Offer Snapshot Tool Works

*A plain-language guide for non-technical readers*

---

## What the tool does (in one sentence)

When someone enters a competitor’s store URL (e.g. `https://example-store.com`), the tool **visits that page like a real browser**, **takes a screenshot**, **reads all the visible offers** (shipping, discounts, bundles, etc.), and **builds a report** with a score, a list of offers, and a screenshot—all in a few seconds.

---

## The big picture: what happens step by step

1. **User enters a URL** on the Offer Snapshot tool page and clicks “Scan” (or lands with a URL in the link for a pre-filled scan).

2. **Our server checks** that the URL is valid and that the user hasn’t hit the rate limit (we allow a limited number of scans per hour per visitor to keep the tool fair and sustainable).

3. **We check the cache.** If we’ve scanned that exact URL recently (within about 30 minutes), we return the stored result immediately so the user doesn’t have to wait and we don’t re-scan unnecessarily.

4. **We “visit” the store in a headless browser.** We don’t open a normal browser window; we use a cloud service (Browserless) that loads the page exactly as a real browser would—including all the JavaScript that many stores use to show banners, promo bars, and offers. That way we see what a real visitor sees, not an empty or half-loaded page.

5. **We capture two things:**
   - The **fully rendered HTML** (the page structure and text after everything has loaded).
   - A **full-page screenshot** of the store.

6. **We upload the screenshot** to our own storage (Cloudflare R2). That gives us a permanent, public link to the image so we can show it in the report (“Site Screenshot” section) and in shareable links.

7. **We analyze the page text** with our “extractor.” It doesn’t use AI for this step—it uses predefined patterns (like “free shipping over £50” or “20% off with code SAVE20”) to find:
   - Shipping thresholds (e.g. free delivery over $75)
   - Discounts (percent off, fixed amount off, promo codes)
   - Bundles (e.g. “Buy 2 get 1 free”, “3 for 2”)
   - Gifts (e.g. “Free gift with orders over £40”)
   - Cart incentives (e.g. “You’re £10 away from free shipping”)
   - Announcement bar / banner text

8. **We score the offers** using simple rules (e.g. “has a shipping threshold” = +15, “has discounts” = +15, “has multiple types of offers” = stacking bonus). The result is a 0–100 score and a grade (e.g. A, B+).

9. **We build the report:** score, grade, list of offers by category, the screenshot, and short recommendations (e.g. “Match competitor’s free shipping threshold”).

10. **We store the result in the cache** and send it back to the user’s browser. The tool page then displays the report (score ring, metrics, offer stack, screenshot, recommendations).

---

## Who does what (services we use)

- **Browserless.io**  
  A “browser in the cloud.” We send it the store URL; it loads the page with a real Chrome engine (including JavaScript), then sends us back the rendered HTML and a screenshot. We use their REST API (simple request/response) rather than holding a long-lived browser connection, which is more reliable for this use case.

- **Cloudflare R2**  
  Object storage (like S3). We upload each screenshot there and get back a public URL (e.g. `https://screenshots.offerpulse.io/snapshots/example-store-1234567890.png`). The report uses that URL to show the “Site Screenshot” and allow full-size view. We don’t store sensitive data—only public store screenshots.

- **Our own API and pages**  
  The marketing site hosts the tool page and an API route (`/api/tools/extract`). That route coordinates: rate limiting → cache check → call to Browserless → upload to R2 → run the extractor → score → cache and return the result.

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
Rate limit check → Cache check
       ↓ (if not cached)
Browserless: load page in real browser → get HTML + screenshot
       ↓
Upload screenshot to R2 → get public URL
       ↓
Extractor: scan HTML for offers (patterns, no AI)
       ↓
Scoring: compute 0–100 + grade
       ↓
Save to cache → return report (score, offers, screenshot URL, recommendations)
       ↓
Tool page displays report
```

---

## Optional: where this was implemented

This behavior was implemented according to the **Snapshot Tool Implementation** plan (see the plan file and the related agent transcript for the full technical history). The main pieces are:

- **Scraper** (Browserless): loads the store and returns HTML + screenshot.  
- **Extractor**: finds offers in the HTML using patterns.  
- **Scoring**: turns extracted offers into a 0–100 score and grade.  
- **API route**: rate limit, cache, Browserless, R2 upload, extract, score, respond.  
- **Tool page**: form, progress, report (score, metrics, offer stack, screenshot, recommendations).

If you want more detail on any single step (e.g. “exactly which phrases we look for” or “how the screenshot gets from Browserless to the report”), we can add a short section for that next.
