# URL Normalization Implementation Guide

## Overview
We've implemented robust URL normalization to improve conversion from ads by accepting common user input patterns without requiring `https://` protocol.

## What Changed

### 1. New URL Helper Functions (`apps/marketing/lib/url-helpers.ts`)
- **`normalizeUrl(input: string): string | null`**
  - Accepts: `"brand.com"`, `"www.brand.com"`, `"http://brand.com"`, etc.
  - Returns: `"https://brand.com/"` (canonical)
  - Returns `null` if invalid

- **`validateUrl(input: string): { ok: boolean; reason?: string }`**
  - Comprehensive validation
  - Returns user-friendly error messages
  - Example: `"Enter a valid store URL (e.g. brand.com)"`

### 2. Updated Components
- ✅ `components/offer-snapshot-form.tsx` (Homepage CTA)
- ✅ `app/(marketing)/free-tools/[slug]/tool/page.tsx` (Free tools)
- ✅ `packages/lib/validators.ts` (Relaxed Zod schema)

### 3. Test Suite
- 📝 `apps/marketing/lib/__tests__/url-helpers.test.ts`
- 40+ test cases
- Jest/Vitest compatible
- Can run standalone: `node url-helpers.test.ts`

## Security Features

### ✅ Allowed
- `brand.com` → `https://brand.com/`
- `www.brand.com` → `https://www.brand.com/`
- `http://brand.com` → `https://brand.com/` (upgraded)
- `brand.com/sale?ref=ad` → `https://brand.com/sale?ref=ad` (preserved)
- `brand.co.uk` → `https://brand.co.uk/`

### ❌ Blocked
- `localhost`, `127.0.0.1` (SSRF protection)
- `192.168.x.x`, `10.x.x.x`, `172.16-31.x.x` (private IPs)
- `javascript:alert(1)` (XSS protection)
- `mailto:`, `file:`, `ftp:` (non-http protocols)
- `brand` (no TLD)
- Empty or whitespace-only input

## Testing Locally

### Manual Testing
1. Start dev server: `npm run dev`
2. Go to homepage: `http://localhost:3000`
3. Try these inputs in the competitor URL field:

```
✓ zara.com
✓ www.asos.com
✓ nike.com/sale
✓ adidas.co.uk?ref=test
✗ localhost (should show error)
✗ javascript:alert(1) (should show error)
✗ brand (should show error)
```

### Run Tests
```bash
# If you have a test framework set up
npm test

# Or run directly
cd apps/marketing/lib
node -r tsx __tests__/url-helpers.test.ts
```

### Expected Behavior
1. User enters `"zara.com"` in homepage CTA
2. User clicks "Get my free snapshot"
3. URL is normalized to `"https://zara.com/"`
4. Validation passes
5. User is redirected to `/snapshot?url=https%3A%2F%2Fzara.com%2F`
6. Analytics tracks normalized URL

## User Experience Improvements

### Before
- Placeholder: `"https://competitor-store.com"`
- User types: `"zara.com"`
- Error: `"Please enter a valid URL"` ❌
- User has to add `https://`
- High friction → Lost conversions

### After
- Placeholder: `"competitor-store.com"`
- User types: `"zara.com"`
- Auto-normalizes to: `"https://zara.com/"` ✅
- No error, seamless flow
- Low friction → Better conversions

## Implementation Details

### Flow Diagram
```
User Input → Trim Whitespace → Add https:// if missing → Validate
             ↓                  ↓                         ↓
          "zara.com"       "https://zara.com"      Check TLD/Protocol
                                                          ↓
                                                    Canonical URL
                                                  "https://zara.com/"
```

### Validation Rules
1. Must have a TLD (e.g., `.com`, `.co.uk`)
2. TLD must be 2-6 letters
3. Must be https protocol (upgraded automatically)
4. Cannot be localhost or private IP
5. Must have valid hostname

## Analytics Impact

All analytics events now track the **normalized URL**:
```typescript
track("marketing_competitor_submitted", { 
  url: "https://zara.com/" // Normalized
})
```

This provides:
- Cleaner analytics data
- Consistent URL formatting
- Better deduplication
- Easier reporting

## Files Changed

```
✅ apps/marketing/lib/url-helpers.ts (NEW)
✅ apps/marketing/lib/__tests__/url-helpers.test.ts (NEW)
✅ apps/marketing/components/offer-snapshot-form.tsx (UPDATED)
✅ apps/marketing/app/(marketing)/free-tools/[slug]/tool/page.tsx (UPDATED)
✅ packages/lib/validators.ts (UPDATED)
```

## Deployment Checklist

- [x] Create URL helper functions
- [x] Add comprehensive tests
- [x] Update homepage CTA form
- [x] Update free tools page
- [x] Relax Zod validator
- [x] Update placeholders
- [x] Test security (localhost/XSS blocking)
- [x] Commit with clear messages
- [x] Push to GitHub
- [ ] Deploy to Vercel
- [ ] Monitor analytics for errors
- [ ] A/B test conversion improvement (optional)

## Rollback Plan

If issues arise, revert these commits:
```bash
git revert HEAD~4..HEAD
git push origin main
```

This will restore the old strict URL validation.

## Success Metrics

Track these metrics post-deployment:
1. **Form error rate**: Should decrease
2. **Bounce rate on homepage**: Should decrease
3. **CTR on CTA**: Should increase
4. **Invalid URL submissions**: Should decrease
5. **Mobile conversion**: Should increase (easier typing)

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify URL normalization works: `normalizeUrl("zara.com")`
3. Check validation: `validateUrl("zara.com")`
4. Review test suite for edge cases
5. Contact: [Your contact info]

---

**Last Updated**: Feb 6, 2026
**Author**: Senior Frontend Engineer
**Status**: ✅ Ready for Production
