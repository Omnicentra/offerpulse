#!/bin/bash

# Deploy Marketing Site to Vercel
# This script automates the deployment process

set -e

echo "🚀 Deploying OfferPulse Marketing Site to Vercel"
echo "================================================"
echo ""

# Navigate to marketing directory
cd apps/marketing

echo "📦 Building locally first to verify..."
pnpm build

if [ $? -ne 0 ]; then
    echo "❌ Local build failed. Please fix errors before deploying."
    exit 1
fi

echo "✅ Local build successful!"
echo ""

echo "🌐 Deploying to Vercel..."
echo ""
echo "When prompted:"
echo "  - Project name: offerpulse-marketing"
echo "  - Link to existing: Choose the existing project if available"
echo "  - Root directory: ./"
echo ""

# Deploy to Vercel
vercel --prod

echo ""
echo "✅ Marketing site deployed!"
echo ""
echo "Next steps:"
echo "1. Copy the production URL you received"
echo "2. Go to Vercel dashboard and update environment variables"
echo "3. Run deploy-dashboard.sh to deploy the dashboard app"
