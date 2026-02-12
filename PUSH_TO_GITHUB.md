# Push OfferPulse to GitHub

## ✅ Current Status

- Git repository initialized
- All files committed locally
- Ready to push to GitHub

---

## Option 1: Create GitHub Repo via Web (Easiest)

### Step 1: Create Repository on GitHub

1. Go to: **https://github.com/new**
2. Repository name: `offerpulse`
3. Description: `OfferPulse - Competitor offer monitoring for Shopify`
4. Visibility: **Public** (or Private if you prefer)
5. **IMPORTANT**: Do NOT initialize with README, .gitignore, or license
6. Click **"Create repository"**

### Step 2: Push Your Code

After creating the repo, GitHub will show you commands. Use these:

```bash
cd /Users/olaoladapo/offerpulse

# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/offerpulse.git

# Push to GitHub
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Option 2: Quick Commands (If you know your username)

```bash
cd /Users/olaoladapo/offerpulse

# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/offerpulse.git
git branch -M main
git push -u origin main
```

---

## After Pushing to GitHub

### Verify Upload

1. Go to: `https://github.com/YOUR_USERNAME/offerpulse`
2. You should see:
   - `apps/` folder with `marketing` and `app`
   - `packages/` folder
   - All documentation files
   - `pnpm-lock.yaml` and `pnpm-workspace.yaml`

### Deploy to Vercel

Now you can deploy via Vercel Dashboard:

👉 **https://vercel.com/new**

1. **Import** your GitHub repository
2. **Create TWO projects**:
   
   **Project 1: Marketing**
   - Root Directory: `apps/marketing`
   - Auto-detect everything else
   
   **Project 2: Dashboard**
   - Root Directory: `apps/app`
   - Auto-detect everything else

3. **Add environment variables** to both projects:
   ```
   NEXT_PUBLIC_MARKETING_APP_URL=https://offerpulse-marketing.vercel.app
   NEXT_PUBLIC_DASHBOARD_APP_URL=https://offerpulse-dashboard.vercel.app
   ```

4. **Deploy both**

5. **Update env vars** with actual Vercel URLs

6. **Redeploy both**

---

## What's Been Committed

✅ Complete marketing site  
✅ Full dashboard app with all features  
✅ Mock data layer  
✅ Cross-app onboarding flow  
✅ Vercel deployment configuration  
✅ Complete documentation  

Total: **124 files, 18,935 lines of code**

---

## Troubleshooting

### If you get "remote: Repository not found"

Make sure:
1. Repository was created on GitHub
2. Username is correct in the URL
3. You have permission to push

### If you get authentication errors

Use SSH instead:
```bash
git remote set-url origin git@github.com:YOUR_USERNAME/offerpulse.git
git push -u origin main
```

Or configure credentials:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## Quick Reference

```bash
# Check remote
git remote -v

# Check commit
git log --oneline

# Push to GitHub
git push -u origin main

# View files that will be pushed
git ls-files
```

---

## Next Steps After GitHub Push

1. ✅ Push code to GitHub (you're doing this now)
2. 🚀 Deploy marketing site via Vercel Dashboard
3. 🚀 Deploy dashboard app via Vercel Dashboard
4. 🔗 Configure custom domains (optional)
5. 🎉 Your apps are live!

---

**First step**: Create repository at https://github.com/new with name `offerpulse`
