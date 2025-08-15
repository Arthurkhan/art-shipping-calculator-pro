# URGENT: Fix GitHub Repository Secrets

## Problem
The deployed app is using the wrong Supabase URL (`coekzxeqsavjmexwjlax.supabase.co` instead of `lkqekrhbxtbowaswvvqs.supabase.co`). This is causing the deployed site to fail because the GitHub Actions workflow is using incorrect secrets.

## Solution Steps

### 1. Update GitHub Repository Secrets

Go to your GitHub repository:
1. Navigate to **Settings** → **Secrets and variables** → **Actions**
2. Update or create the following secrets:

```
VITE_SUPABASE_URL=https://lkqekrhbxtbowaswvvqs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcWVrcmhieHRib3dhc3d2dnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NzUzMjcsImV4cCI6MjA2NjE1MTMyN30.54mgLb4f6lhKNn4dZJVVqB3JTgnS486IPhKpWx9nYNk
VITE_APP_URL=https://arthurkhan.github.io/art-shipping-calculator-pro
```

### 2. Clear Browser Cache (For Users)

If the app still shows the wrong URL in the browser:

#### Option A: Force Refresh
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

#### Option B: Clear All Cache
1. Open Chrome DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

#### Option C: Clear Service Worker
1. Open Chrome DevTools (F12)
2. Go to Application tab
3. Click "Storage" in the left sidebar
4. Click "Clear site data"

### 3. Deploy the Fixed Version

After updating the secrets, trigger a new deployment:

#### Option A: Push a commit
```bash
git add .
git commit -m "Fix Supabase URL configuration and cache busting"
git push origin main
```

#### Option B: Manually trigger workflow
1. Go to **Actions** tab in GitHub
2. Click on "Deploy to GitHub Pages" workflow
3. Click "Run workflow" → "Run workflow"

### 4. Verify the Fix

After deployment (takes ~2-3 minutes):
1. Open the site in an incognito/private window
2. Open browser DevTools (F12)
3. Check the Console tab - you should NOT see any errors about `coekzxeqsavjmexwjlax.supabase.co`
4. The app should load normally

### 5. What We Fixed

1. **Service Worker**: Updated cache version from 1.0.2 to 1.0.3 to force cache refresh
2. **Environment Validation**: Added logging to verify correct Supabase URL is being used
3. **Cache Headers**: Added meta tags to prevent aggressive caching
4. **GitHub Secrets**: Documented correct values for repository secrets

## Prevention

To prevent this issue in the future:
1. Always verify GitHub secrets match your `.env.local` file
2. Use different cache names when changing critical configuration
3. Test deployments in incognito mode first
4. Monitor browser console for configuration warnings

## Service Worker Issue (FIXED)

### The Problem
The old service worker was caching API responses with the wrong Supabase URL, causing persistent errors even after fixing the configuration.

### The Solution (Already Applied)
1. **Removed service worker entirely** - Deleted sw.js from the project
2. **Added automatic unregistration** - main.tsx now unregisters any existing service workers
3. **Created cache clear page** - Visit `/clear-cache.html` to force clear everything

### If You Still See Errors

Visit the cache clear page directly:
```
https://arthurkhan.github.io/art-shipping-calculator-pro/clear-cache.html
```

This page will:
- Unregister all service workers
- Clear all caches
- Remove all stored data
- Fix the connection issues

After clearing, the app should work normally.

## Troubleshooting

If the issue persists after following these steps:

1. **Check GitHub Actions logs**: 
   - Go to Actions tab → Latest workflow run → build job
   - Verify environment variables are being set correctly

2. **Verify secrets are set**:
   ```bash
   # You can't read secrets directly, but you can verify they exist
   # by checking the Settings → Secrets page
   ```

3. **Check the built files**:
   - Download the artifact from GitHub Actions
   - Search for Supabase URL in the JavaScript files
   - Should only find `lkqekrhbxtbowaswvvqs`

4. **Nuclear option** - Complete cache clear:
   - Clear all browser data for the site
   - Unregister service workers
   - Clear localStorage
   - Clear IndexedDB

## Contact

If you continue to experience issues, check:
- Browser console for specific error messages
- Network tab for failed requests
- Application tab for service worker status