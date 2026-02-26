# Multi-Page Offer Snapshot Testing Guide

## Prerequisites

Before testing, you need to set up the following environment variables in your `.env` file:

```bash
# Firecrawl API Key (get from https://firecrawl.dev)
FIRECRAWL_API_KEY=fc-YOUR_API_KEY_HERE

# Upstash Redis (get from https://upstash.com)
UPSTASH_REDIS_REST_URL=https://YOUR_REDIS_URL.upstash.io
UPSTASH_REDIS_REST_TOKEN=YOUR_REDIS_TOKEN_HERE

# Existing variables should already be set
BROWSERLESS_API_KEY=...
OPENROUTER_API_KEY=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=...
```

## Test Scenarios

### Test 1: Basic Shopify Store (Small)
**Store**: `allbirds.com` or `glossier.com`
**Expected Results**:
- Should discover 10-20 pages
- Should successfully scrape homepage, shipping page, returns page, FAQ
- Should find shipping thresholds and return policies
- Deduplication should remove duplicate offers found on multiple pages
- Time: ~25-35 seconds

### Test 2: Large Shopify Store
**Store**: `gymshark.com` or `fashionnova.com`
**Expected Results**:
- Should discover 50-100+ pages
- Should filter down to top 15-25 most relevant pages
- Should find multiple discounts, bundles, cart incentives across product pages
- Should handle failures gracefully if some pages time out
- Time: ~30-40 seconds

### Test 3: Store with Cart/Checkout Incentives
**Store**: Any store with visible cart page (e.g., `taylor-stitch.com`)
**Expected Results**:
- Should scrape cart page successfully
- Should extract "You're $X away from free shipping" messages
- Should find tiered discount offers (spend $X get Y% off)
- Source pages should include "Cart page"

### Test 4: Store with Multiple Offer Pages
**Store**: Any DTC brand with dedicated sales/promotion pages
**Expected Results**:
- Should discover sale pages, clearance pages
- Should aggregate offers from homepage, sale page, product pages
- Should show which pages each offer was found on
- Deduplication rate should be 20-40% (many offers repeated across pages)

### Test 5: Rate Limiting
**Test Process**:
1. Submit 5 different store URLs within 15 minutes
2. On the 6th request, should see "Rate limit exceeded" error
3. Wait 15 minutes, should be able to submit again
**Expected Results**:
- First 5 requests: Success
- 6th request: 429 error with helpful message
- After 15 min cooldown: Success again

### Test 6: Cache Behavior
**Test Process**:
1. Submit a store URL (e.g., `allbirds.com`)
2. Wait for full analysis to complete (~30s)
3. Submit the same URL again immediately
**Expected Results**:
- First request: Takes ~30 seconds, shows "cached: false"
- Second request: Returns instantly (<1s), shows "cached: true"
- Same results for both requests
- Cache should persist for 24 hours

### Test 7: Error Handling - Invalid URL
**Test Cases**:
- `not-a-real-domain-12345.com` - Should show "Failed to load" error
- `http://localhost:3000` - Should show "Invalid URL format"
- Empty string - Should show "URL is required"
**Expected Results**:
- Graceful error messages
- No server crashes
- User can retry with correct URL

### Test 8: Error Handling - Some Pages Fail
**Scenario**: Store with some pages behind auth or 404
**Expected Results**:
- Should show "X/Y pages successfully scraped" in stats
- Failed pages show "Failed" badge in Pages Analyzed section
- Should still aggregate offers from successful pages
- Should not crash or show incomplete data

## Verification Checklist

After running tests, verify:

### Frontend Display
- [ ] "Pages Analyzed" section shows correctly
- [ ] Each offer shows "Found on: [Page 1, Page 2]" badges
- [ ] Stats section shows: Total Pages, Successful Pages, Duplicates Removed %
- [ ] Progress indicator shows all 6 steps during scraping
- [ ] Page titles appear correctly in "Pages Analyzed" list
- [ ] Failed pages show red "Failed" badge
- [ ] Successful pages show green "✓ Scraped" badge and offer count

### API Response
- [ ] Response includes `pagesAnalyzed` array with URL, title, success status
- [ ] Response includes `stats` object with deduplication metrics
- [ ] Response includes `domain` field
- [ ] All offers have `sourcePages` array populated
- [ ] Shipping threshold shows source pages
- [ ] Announcements are objects with `text` and `sourcePages`

### Performance
- [ ] URL discovery completes in 2-4 seconds
- [ ] Full analysis completes in 25-40 seconds
- [ ] Rate limiting works across different serverless instances (Upstash)
- [ ] Cache works correctly (instant response on repeat)
- [ ] No memory leaks or hung processes

### Data Quality
- [ ] Homepage always included in pages analyzed
- [ ] Shipping page is prioritized if it exists
- [ ] Cart/checkout pages are scraped if discoverable
- [ ] Duplicate offers are properly deduplicated
- [ ] Source page labels are human-readable (not just URLs)
- [ ] Offers found on multiple pages show all source pages

## Common Issues & Solutions

### Issue: "FIRECRAWL_API_KEY is required"
**Solution**: Make sure `.env` file has `FIRECRAWL_API_KEY=fc-...`

### Issue: "Rate limit exceeded" on first request
**Solution**: Check Upstash Redis is configured correctly, or restart dev server

### Issue: All pages show "Failed to scrape"
**Solution**: Check `BROWSERLESS_API_KEY` is valid and account has credits

### Issue: No offers found on any page
**Solution**: Check store URL is correct and publicly accessible (not behind auth)

### Issue: TypeScript errors
**Solution**: Run `pnpm type-check` - should pass with zero errors

## Development Server

To test locally:

```bash
# From repository root
cd apps/marketing

# Start development server
pnpm dev

# Open in browser
open http://localhost:3000/free-tools/offer-snapshot/tool
```

## Production Testing

After deploying to Vercel:

1. Set environment variables in Vercel dashboard
2. Trigger redeployment
3. Test on production URL: `https://offerpulse.com/free-tools/offer-snapshot/tool`
4. Monitor Vercel logs for any errors
5. Check Firecrawl dashboard for credit usage
6. Check Upstash dashboard for rate limit hits

## Success Criteria

The implementation is successful if:

✅ All 8 test scenarios pass without errors
✅ Performance is within expected ranges (25-40s for multi-page)
✅ Rate limiting works correctly (Upstash-based)
✅ Cache persists correctly for 24 hours
✅ Frontend displays all multi-page information correctly
✅ Error handling is graceful and informative
✅ No TypeScript errors (`pnpm type-check` passes)
✅ Source page attribution works correctly
✅ Deduplication works (20-40% reduction typical)
✅ Failed pages don't crash the entire analysis

## Cost Monitoring

For each analysis:
- Firecrawl: 1 credit for URL discovery (~$0.01)
- Browserless: 15-25 credits for scraping (~$0.08-0.13)
- OpenRouter: 1 image analysis for homepage (~$0.002)
- **Total per analysis: ~$0.09-0.14**

Monitor costs in dashboards:
- Firecrawl: https://firecrawl.dev/app/usage
- Browserless: https://cloud.browserless.io/usage
- OpenRouter: https://openrouter.ai/usage
- Upstash: https://console.upstash.com

## Next Steps After Testing

Once testing is complete:

1. [ ] Deploy to production
2. [ ] Monitor error rates in first 24 hours
3. [ ] Adjust rate limits if needed based on usage
4. [ ] Consider adding "Quick scan (5 pages)" vs "Deep scan (20 pages)" toggle
5. [ ] Start planning dashboard integration for knowledge base feature
