# Vercel Deployment Fix Guide

## The Problem

The deployment is failing due to incompatible pnpm lockfile versions between your local setup (pnpm 9.x lockfile) and Vercel's build environment (Node.js/pnpm compatibility issues).

## Solution: Manual Project Settings Update

You need to update your Vercel project settings **once** in the dashboard:

### Step 1: Update Project Settings

1. Go to: **https://vercel.com/olas-projects-9ef54fc0/offerpulse/settings**
2. Click on **Build and Deployment** (left sidebar)
3. Under **Build Settings**:
   - **Root Directory**: Leave as `.` (repo root) or empty
   - **Framework Preset**: Select **Next.js** from dropdown
   - **Build Command**: Leave empty (uses `package.json` script)
   - **Output Directory**: Leave empty (uses `.next` default)
   - **Install Command**: Leave empty (uses auto-detection)
4. Click **Save**

### Step 2: Delete Environment Overrides

Scroll down to **Production Overrides** section and clear any custom commands that might be set there (if any exist).

### Step 3: Deploy

From your repo root:

```bash
vercel --prod
```

## How This Works

- **Root Directory = `.`**: Vercel has access to the entire monorepo
- **Framework = Next.js**: Vercel automatically detects and configures Next.js properly
- **No custom commands**: Vercel's Turbo detection handles the monorepo build automatically
- The earlier successful deployment (offerpulse-g4erb6qfe) used this exact setup

## Alternative: Use the Earlier Working Deployment

Your deployment **offerpulse-g4erb6qfe-olas-projects-9ef54fc0.vercel.app** succeeded and is live. To promote it:

```bash
vercel alias offerpulse-g4erb6qfe-olas-projects-9ef54fc0.vercel.app offerpulse-iota.vercel.app --prod
```

Or just redeploy from the dashboard by selecting that successful deployment and clicking "Promote to Production".

## Why Manual Settings?

The Vercel API/CLI cannot programmatically change project settings like Root Directory or Framework Preset - these must be updated through the dashboard UI.
