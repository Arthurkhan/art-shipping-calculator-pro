# GitHub Pages Deployment Guide

## 🔐 Security-First Deployment for Art Shipping Calculator

This guide explains how to securely deploy the Art Shipping Calculator to GitHub Pages without exposing sensitive credentials.

## Prerequisites

- GitHub repository (public)
- Supabase project
- FedEx Developer account
- GitHub Actions enabled

## 🚨 Important Security Notes

1. **NEVER commit sensitive credentials to your repository**
2. **NEVER store API keys in frontend code**
3. **ALWAYS use environment variables for configuration**
4. **ALWAYS enable Row Level Security (RLS) on Supabase tables**

## Step 1: Set Up GitHub Repository Secrets

Navigate to your repository's Settings → Secrets and variables → Actions, and add:

### Required Secrets

```
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Deployment Configuration
VITE_APP_URL=https://your-username.github.io/your-repo-name
```

### Optional Configuration

```
# Feature Flags
VITE_ENABLE_DEBUG=false
VITE_ENCRYPT_STORAGE=true
```

## Step 2: Configure GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_APP_URL: ${{ secrets.VITE_APP_URL }}
          VITE_ENABLE_DEBUG: false
          VITE_ENCRYPT_STORAGE: true

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Step 3: Configure Vite for Production

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/your-repo-name/', // Replace with your repo name
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select'],
        },
      },
    },
  },
});
```

## Step 4: Security Headers (via meta tags)

Add to your `index.html`:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               font-src 'self' data:; 
               connect-src 'self' https://*.supabase.co https://apis.fedex.com;">
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="X-Frame-Options" content="DENY">
<meta http-equiv="X-XSS-Protection" content="1; mode=block">
<meta name="referrer" content="no-referrer-when-downgrade">
```

## Step 5: Deploy Supabase Edge Functions

Deploy the secure edge functions:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-id

# Set environment variables
supabase secrets set FEDEX_ENCRYPTION_SECRET="your-strong-encryption-secret"

# Deploy functions
supabase functions deploy calculate-shipping
supabase functions deploy fedex-config
```

## Step 6: Enable GitHub Pages

1. Go to Settings → Pages
2. Source: Deploy from a branch
3. Branch: gh-pages (created by the workflow)
4. Save

## Step 7: Post-Deployment Security Checklist

- [ ] Verify no sensitive data in repository
- [ ] Check browser DevTools Network tab - no credentials visible
- [ ] Test with wrong credentials - proper error handling
- [ ] Verify HTTPS is enforced
- [ ] Check browser console for security warnings
- [ ] Run security headers test
- [ ] Verify Supabase RLS policies are active

## Local Development

For local development, create `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5173
VITE_ENABLE_DEBUG=true
```

## Security Best Practices

1. **API Keys**: Never commit API keys. Use environment variables.
2. **Encryption**: All sensitive data is encrypted in transit and at rest.
3. **Session Management**: FedEx credentials use temporary sessions.
4. **Input Validation**: All user inputs are sanitized.
5. **CORS**: Properly configured on edge functions.
6. **RLS**: Row Level Security enabled on all Supabase tables.

## Troubleshooting

### Build Fails
- Check all environment variables are set in GitHub Secrets
- Verify secret names match exactly (case-sensitive)

### FedEx Config Not Working
- Ensure edge functions are deployed
- Check Supabase function logs
- Verify FEDEX_ENCRYPTION_SECRET is set

### Supabase Connection Issues
- Verify Supabase URL and anon key
- Check RLS policies allow read access
- Ensure CORS is configured correctly

## Monitoring

1. **GitHub Actions**: Monitor deployment workflows
2. **Supabase Dashboard**: Check function invocations and errors
3. **Browser Console**: Watch for client-side errors
4. **Network Tab**: Verify no sensitive data in requests

## Updates and Maintenance

1. Regularly update dependencies: `npm update`
2. Monitor Supabase and FedEx API changes
3. Rotate encryption keys periodically
4. Review security logs

## Support

For issues:
1. Check browser console for errors
2. Review Supabase function logs
3. Verify all environment variables
4. Test with minimal configuration first

Remember: Security is not a one-time setup. Regularly review and update your security measures.
