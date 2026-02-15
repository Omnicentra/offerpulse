# Social Sharing QA Checklist

## ✅ Implementation Complete

### What's Been Added:

1. **Footer Social Links**
   - LinkedIn, Instagram, and X/Twitter
   - Button-style design with icons + labels
   - Opens in new tab with `rel="noopener noreferrer me"`
   - Accessible with aria-labels
   - Mobile responsive

2. **OpenGraph Images**
   - Default OG image at `/og/og-default.png` (1200x630)
   - Dynamic OG generation at `/og` route
   - Tool pages use dynamic OG with tool name
   - Blog posts use dynamic OG with post title

3. **Updated Metadata**
   - Correct Twitter handle: @OfferPulseio
   - Consistent OpenGraph tags across all pages
   - Canonical URLs properly set
   - Per-page metadata for tools and blog posts

4. **Organization Schema**
   - Updated `sameAs` with all 3 social profiles
   - LinkedIn, Instagram, X/Twitter URLs included

---

## 🧪 Manual Testing

### Test Social Sharing Previews:

**LinkedIn Post Inspector:**
1. Go to: https://www.linkedin.com/post-inspector/
2. Test these URLs:
   - https://www.offerpulse.io
   - https://www.offerpulse.io/free-tools
   - https://www.offerpulse.io/free-tools/offer-snapshot
   - https://www.offerpulse.io/blog/monitor-competitor-promos-without-spreadsheets

**Expected**: Clean preview with title, description, and OG image

**X/Twitter Card Validator:**
1. Go to: https://cards-dev.twitter.com/validator
2. Test same URLs as above

**Expected**: summary_large_image card with proper title/description

**Facebook Sharing Debugger:**
1. Go to: https://developers.facebook.com/tools/debug/
2. Test homepage and key tool pages

**Expected**: Proper OG tags and image preview

---

### Test Footer Links:

**Visit any page on the site:**
- [ ] Scroll to footer
- [ ] See "Follow us" section
- [ ] See 3 social buttons: LinkedIn, Instagram, X
- [ ] Click each link → opens in new tab
- [ ] Verify URLs are correct:
  - LinkedIn: https://linkedin.com/company/offerpulseio
  - Instagram: https://instagram.com/offerpulse.io
  - X: https://x.com/OfferPulseio

**Mobile:**
- [ ] Resize browser to mobile
- [ ] Social links stack properly
- [ ] All links still clickable and functional

---

### Verify Metadata in HTML Source:

```bash
# Check homepage has correct OG tags
curl -s https://www.offerpulse.io | grep -E 'og:|twitter:'

# Should include:
# <meta property="og:title" content="OfferPulse | Competitor Offer Monitoring for Shopify Sellers" />
# <meta property="og:image" content="https://www.offerpulse.io/og/og-default.png" />
# <meta name="twitter:card" content="summary_large_image" />
# <meta name="twitter:site" content="@OfferPulseio" />

# Check tool page dynamic OG
curl -s https://www.offerpulse.io/free-tools/offer-snapshot | grep 'og:image'

# Should include dynamic OG URL: /og?title=...

# Check blog post OG
curl -s https://www.offerpulse.io/blog/monitor-competitor-promos-without-spreadsheets | grep 'og:image'

# Verify Organization schema includes social links
curl -s https://www.offerpulse.io | grep -A 30 '"@type":"Organization"' | grep sameAs
```

---

### Test OG Image Accessibility:

```bash
# Check default OG image exists and is accessible
curl -I https://www.offerpulse.io/og/og-default.png

# Should return: 200 OK

# Check dynamic OG route works
curl -I "https://www.offerpulse.io/og?title=Test"

# Should return: 200 OK
# Content-Type: image/png
```

---

### Verify rel="me" for Identity:

```bash
# Check footer links have rel="me"
curl -s https://www.offerpulse.io | grep 'rel=".*me"'

# Should find: rel="noopener noreferrer me" on social links
```

---

## 📋 Files Changed:

1. **`app/layout.tsx`**
   - Updated Twitter handle to @OfferPulseio
   - Updated OG image path to /og/og-default.png

2. **`components/footer.tsx`**
   - Added social links array with icons
   - Added "Follow us" section
   - Implemented rel="me" for identity linking

3. **`lib/seo/config.ts`**
   - Updated SOCIAL_LINKS with official URLs

4. **`lib/seo/metadata.ts`**
   - Enhanced generateToolMetadata with dynamic OG support
   - Added Twitter site/creator handles

5. **`app/og/route.tsx`** (NEW)
   - Dynamic OG image generation with next/og
   - Customizable title and subtitle

6. **`app/(marketing)/free-tools/page.tsx`**
   - Added explicit OpenGraph and Twitter metadata

7. **`app/(marketing)/free-tools/[slug]/page.tsx`**
   - Uses dynamic OG images

8. **`app/(marketing)/blog/[slug]/page.tsx`**
   - Uses dynamic OG images
   - Added Twitter site/creator

9. **`public/og/og-default.png`** (NEW)
   - Default social sharing image (1200x630)

---

## ✅ Success Criteria:

- [x] Footer has social links on all pages
- [x] Links open in new tab with proper rel attributes
- [x] Organization schema includes sameAs
- [x] Default OG image created and accessible
- [x] Dynamic OG images for tools and blog
- [x] Twitter handle updated to @OfferPulseio
- [x] All pages have unique OG titles/descriptions
- [x] Canonical URLs are correct
- [x] Mobile responsive
- [x] Accessible with ARIA labels
- [x] Build passes successfully

---

## 🚀 Deployment:

After pushing to GitHub, Vercel will auto-deploy.

**Test on production:**
1. Wait for deployment to complete
2. Use LinkedIn Post Inspector with your live URLs
3. Use Twitter Card Validator
4. Share on social to verify previews look correct

---

## 📊 Expected Social Previews:

**Homepage:**
- Title: "OfferPulse | Competitor Offer Monitoring for Shopify Sellers"
- Description: Product value prop
- Image: Clean gradient with logo and headline

**Tool Pages:**
- Title: "[Tool Name]"
- Description: Tool-specific description
- Image: Dynamic with tool name and description

**Blog Posts:**
- Title: "[Post Title]"
- Description: Post description
- Image: Dynamic with post title and subtitle

---

Last Updated: 2026-02-10
Status: ✅ Ready for production
