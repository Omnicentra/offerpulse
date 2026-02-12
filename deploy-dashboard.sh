#!/bin/bash

# Deploy Dashboard App to Vercel
# This script automates the deployment process

set -e

echo "🚀 Deploying OfferPulse Dashboard App to Vercel"
echo "================================================"
echo ""

# Navigate to app directory
cd apps/app

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
echo "  - Project name: offerpulse-dashboard"
echo "  - Link to existing: Choose the existing project if available"
echo "  - Root directory: ./"
echo ""

# Deploy to Vercel
vercel --prod

echo ""
echo "✅ Dashboard app deployed!"
echo ""
echo "Next steps:"
echo "1. Update environment variables in both projects"
echo "2. Test the cross-app flow"
echo "3. Configure custom domains (optional)"
