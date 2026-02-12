#!/bin/bash

# OfferPulse Vercel Deployment Script

echo "🚀 Deploying OfferPulse to Vercel"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install with: npm i -g vercel"
    exit 1
fi

echo "This script will help you deploy both apps."
echo ""
echo "You need to create TWO separate Vercel projects:"
echo "  1. Marketing site (offerpulse.com)"
echo "  2. Dashboard app (app.offerpulse.com)"
echo ""
read -p "Press Enter to continue..."

# Deploy Marketing
echo ""
echo "📱 Deploying Marketing Site..."
echo "Go to: https://vercel.com/new"
echo "Or run: cd apps/marketing && vercel"
echo ""
read -p "Press Enter when marketing is deployed..."

# Deploy Dashboard
echo ""
echo "📊 Deploying Dashboard App..."
echo "Go to: https://vercel.com/new"
echo "Or run: cd apps/app && vercel"
echo ""
echo "⚠️  Don't forget to add environment variables:"
echo "   - DATABASE_URL"
echo "   - NEXTAUTH_SECRET"
echo "   - NEXTAUTH_URL"
echo ""
read -p "Press Enter when dashboard is deployed..."

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Set up domains in Vercel project settings"
echo "2. Run database migrations for dashboard app"
echo "3. Test both deployments"
