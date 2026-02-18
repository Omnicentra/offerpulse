# Troubleshooting Guide

## Issue: localhost not working

### Quick Fixes

1. **Check if servers are running:**
   ```bash
   lsof -ti:3000,3001
   ```
   If nothing shows, servers aren't running.

2. **Start the servers:**
   ```bash
   # From root directory
   pnpm dev
   ```

3. **If you see errors, try running individually:**
   ```bash
   # Marketing app
   cd apps/marketing
   pnpm dev
   
   # Dashboard app (in another terminal)
   cd apps/app
   pnpm dev
   ```

### Common Issues

#### "Cannot find module" errors
- Run `pnpm install` from root directory
- Make sure shared packages are built

#### "Port already in use"
```bash
# Kill processes on ports
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

#### Database connection errors (Dashboard app)
- Make sure `.env.local` exists in `apps/app/`
- Update `DATABASE_URL` with your actual database connection
- For quick testing, you can use a placeholder (app will show errors but still start)

#### TypeScript errors
- The tsconfig has been fixed
- Try running `pnpm type-check` in each app to see specific errors

### Step-by-Step Debug

1. **Test Marketing App:**
   ```bash
   cd apps/marketing
   pnpm dev
   ```
   Should start on http://localhost:3000

2. **Test Dashboard App:**
   ```bash
   cd apps/app
   # Make sure .env.local exists
   pnpm dev
   ```
   Should start on http://localhost:3001

3. **Check for build errors:**
   ```bash
   cd apps/marketing
   pnpm build
   
   cd ../app
   pnpm build
   ```

### Still Not Working?

1. Check the terminal output for specific error messages
2. Make sure Node.js version is 18+
3. Try clearing `.next` folders:
   ```bash
   rm -rf apps/*/node_modules apps/*/.next
   pnpm install
   ```
