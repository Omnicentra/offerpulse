# ✅ Ready to Run!

Everything is set up and ready. Here's what you need to do:

## 🎯 Next Steps (5 minutes)

### 1. Set Up Database

You need a PostgreSQL database. Choose one:

**Option A: Local PostgreSQL**
```bash
# If you have PostgreSQL installed:
createdb offerpulse
```

**Option B: Cloud Database (Easiest)**
- Go to https://neon.tech (free tier)
- Create a new project
- Copy the connection string

### 2. Configure Environment

Create `apps/app/.env.local`:

```bash
cd apps/app
cat > .env.local << 'EOF'
DATABASE_URL="your-postgresql-connection-string-here"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3001"
EOF
```

Or manually create the file with:
```env
DATABASE_URL="postgresql://user:password@host:port/database"
NEXTAUTH_SECRET="any-random-string-here"
NEXTAUTH_URL="http://localhost:3001"
```

### 3. Initialize Database

```bash
cd apps/app
pnpm db:push
pnpm db:seed
```

### 4. Run the Apps! 🚀

From the root directory:

```bash
pnpm dev
```

## 🎉 You're Done!

- **Marketing:** http://localhost:3000
- **Dashboard:** http://localhost:3001

**Demo Account:**
- Email: `demo@offerpulse.io`
- Password: `demo123`

## 📋 What's Included

✅ Monorepo with Turborepo
✅ Marketing app (moved to apps/marketing)
✅ Dashboard app with full Prisma schema
✅ Authentication (NextAuth)
✅ Dashboard layout with sidebar
✅ Overview and Competitors pages
✅ Demo data seeded
✅ All dependencies installed

## 🆘 Quick Troubleshooting

**"Can't connect to database"**
→ Check DATABASE_URL in apps/app/.env.local

**"Port already in use"**
→ Kill the process or change ports in package.json

**"Module not found"**
→ Run `pnpm install` from root

## 📚 More Help

- See [SETUP.md](./SETUP.md) for detailed instructions
- See [README.md](../README.md) for project overview
