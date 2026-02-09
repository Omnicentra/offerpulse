#!/bin/bash

# OfferPulse Database Setup Script

echo "🚀 Setting up OfferPulse database..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    echo "Creating .env.local template..."
    cat > .env.local << EOF
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/offerpulse?schema=public"

# NextAuth
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3001"
EOF
    echo "✅ Created .env.local template"
    echo "⚠️  Please update DATABASE_URL with your PostgreSQL connection string"
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=" .env.local || grep -q 'DATABASE_URL="postgresql://user:password' .env.local; then
    echo "⚠️  Please update DATABASE_URL in .env.local with your actual database connection string"
    exit 1
fi

echo "✅ .env.local found"

# Generate Prisma client
echo "📦 Generating Prisma client..."
pnpm db:generate

# Push schema to database
echo "🗄️  Pushing schema to database..."
pnpm db:push

# Seed database
echo "🌱 Seeding database with demo data..."
pnpm db:seed

echo "✅ Database setup complete!"
echo ""
echo "You can now run: pnpm dev"
echo "Dashboard will be available at http://localhost:3001"
echo "Demo account: demo@offerpulse.io / demo123"
