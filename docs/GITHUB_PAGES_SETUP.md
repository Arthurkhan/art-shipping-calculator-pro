# GitHub Pages Setup Instructions

## Quick Setup (One-time only)

1. **Go to your repository settings**
   - Navigate to: https://github.com/Arthurkhan/art-shipping-calculator-pro/settings
   - Scroll down to the "Pages" section in the left sidebar

2. **Enable GitHub Pages**
   - Under "Source", select "GitHub Actions"
   - Click "Save"

3. **That's it!** 
   - The workflow will automatically run and deploy your app
   - Check the Actions tab to see the deployment progress
   - Your app will be available at: https://arthurkhan.github.io/art-shipping-calculator-pro/

## How it Works

- Every time you push to the `main` branch, GitHub Actions automatically:
  - Builds your app
  - Deploys it to GitHub Pages
  - No build minute limits!

## Embedding in Squarespace

Once deployed, use this URL in your Squarespace iframe:
```
https://arthurkhan.github.io/art-shipping-calculator-pro/
```

## Benefits over Netlify

- ✅ **Unlimited builds** - No monthly limits
- ✅ **Direct integration** - Pushes to main auto-deploy
- ✅ **Zero configuration** - Works out of the box
- ✅ **Forever free** - No premium plans needed
- ✅ **Fast CDN** - GitHub's global CDN

## Troubleshooting

If the deployment fails:
1. Check the Actions tab for error messages
2. Make sure GitHub Pages is enabled in settings
3. Ensure the workflow has proper permissions

## Manual Deployment

You can also trigger a deployment manually:
1. Go to the Actions tab
2. Select "Deploy to GitHub Pages"
3. Click "Run workflow"
