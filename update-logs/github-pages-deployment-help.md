# GitHub Pages Deployment Help
Date: 2025-06-26

## Quick Actions to Fix Deployment

### 1. Check Workflow Status
Visit: https://github.com/Arthurkhan/art-shipping-calculator-pro/actions

### 2. Add Required Secrets
Go to: Settings → Secrets and variables → Actions

Add these secrets:
- `VITE_SUPABASE_URL`: https://lkqekrhbxtbowaswvvqs.supabase.co
- `VITE_SUPABASE_ANON_KEY`: Your anon key
- `VITE_APP_URL`: https://arthurkhan.github.io/art-shipping-calculator-pro

### 3. Manual Deployment Trigger
If automatic deployment failed, you can:
1. Go to Actions tab
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow" → "Run workflow" on main branch

### 4. Clear Browser Cache
After deployment succeeds:
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Or open in incognito/private browsing mode

### 5. Verify GitHub Pages Settings
Go to: Settings → Pages
- Source should be: "GitHub Actions"
- Your site should be published at: https://arthurkhan.github.io/art-shipping-calculator-pro/

## Common Issues

### Deployment Not Triggering
- Ensure you're pushing to the `main` branch
- Check if Actions are enabled in repository settings

### Build Failures
- Missing secrets will cause build to fail
- Check Actions logs for specific error messages

### Site Not Updating
- GitHub Pages can take 5-10 minutes to update
- CDN caching can delay changes - use hard refresh
- Check deployment status in Actions tab

## Your Current Setup
- Workflow: Configured correctly in `.github/workflows/deploy.yml`
- Vite config: Properly set with base URL
- Latest commit: "Bug fixes" - should have triggered deployment

## Next Steps
1. Check Actions tab for workflow status
2. If no recent runs, add secrets and trigger manually
3. If deployment succeeded but site unchanged, clear cache and wait 10 minutes
