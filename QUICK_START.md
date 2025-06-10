# Quick Start: Deploy to Netlify & Add to Squarespace

## 🚀 Part 1: Deploy to Netlify (10 minutes)

### Step 1: Get Your Supabase Credentials
1. Go to your Supabase project
2. Click **Settings** → **API**
3. Copy:
   - **Project URL** (starts with https://)
   - **anon public** key

### Step 2: Deploy with One Click
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Arthurkhan/art-shipping-calculator-pro)

**OR** Deploy Manually:

1. Go to [netlify.com](https://netlify.com) and sign in with GitHub
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** → Select `art-shipping-calculator-pro`
4. **Build settings** (should auto-detect):
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click **"Show advanced"** → Add environment variables:
   - `VITE_SUPABASE_URL` = [your project URL]
   - `VITE_SUPABASE_ANON_KEY` = [your anon key]
6. Click **"Deploy site"**

### Step 3: Note Your URL
After deployment (2-3 minutes), you'll get a URL like:
```
https://amazing-shipping-calc-123.netlify.app
```

### Step 4: Configure CORS in Supabase
1. In Supabase, go to **Authentication** → **URL Configuration**
2. Add these URLs to **Redirect URLs**:
   ```
   https://your-app-name.netlify.app
   https://www.nazare-aga.com
   ```

---

## 🎨 Part 2: Add to Squarespace (5 minutes)

### Step 1: Create a New Page
1. In Squarespace, go to **Pages**
2. Click **+** → **Blank Page**
3. Name it: **"Shipping Calculator"**
4. URL Slug: `/shipping-calculator`

### Step 2: Add the Auto-Resizing Calculator
1. Edit your new page
2. Click **+** → **Code**
3. Paste this code (replace the URL!):

```html
<!-- Auto-resizing iframe container -->
<div id="shipping-calc-container" style="width: 100%; max-width: 1200px; margin: 0 auto;">
  <!-- Loading message -->
  <div id="calc-loading" style="text-align: center; padding: 40px;">
    Loading shipping calculator...
  </div>
  
  <!-- The iframe -->
  <iframe 
    id="shipping-calculator-iframe"
    src="https://YOUR-NETLIFY-URL.netlify.app" 
    width="100%" 
    height="800px"
    frameborder="0"
    scrolling="no"
    style="border: none; display: none;"
    title="Shipping Calculator">
  </iframe>
</div>

<script>
(function() {
  const iframe = document.getElementById('shipping-calculator-iframe');
  const loading = document.getElementById('calc-loading');
  
  // Show iframe when loaded
  iframe.onload = function() {
    loading.style.display = 'none';
    iframe.style.display = 'block';
  };
  
  // Auto-resize based on content
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'resize' && e.data.height) {
      iframe.style.height = (parseInt(e.data.height) + 50) + 'px';
    }
  });
})();
</script>
```

4. **Important**: Replace `YOUR-NETLIFY-URL` with your actual Netlify URL
5. Save the page

### Step 3: Add to Navigation
1. Go to **Pages**
2. Drag "Shipping Calculator" to your main navigation
3. Save

---

## ✅ That's It! 

Your shipping calculator is now live at:
```
www.nazare-aga.com/shipping-calculator
```

The iframe will automatically adjust its height to show all content - no cutoffs!

---

## 🛠️ Troubleshooting

### Calculator not showing?
- Check if your Netlify site works directly
- Make sure you replaced the URL in the iframe code
- Check browser console for errors (F12)

### Content still cut off?
- Make sure you deployed the latest code to Netlify
- The app now includes auto-resize functionality
- Try refreshing the page

### Want a simple fixed height instead?
Replace the code above with:
```html
<div style="width: 100%; max-width: 1200px; margin: 0 auto;">
  <iframe 
    src="https://YOUR-NETLIFY-URL.netlify.app" 
    width="100%" 
    height="1500px"
    frameborder="0"
    style="border: none;">
  </iframe>
</div>
```

---

## 💡 Pro Tips

1. **Custom Domain**: In Netlify, you can set up `shipping.nazare-aga.com`
2. **Analytics**: Netlify provides free analytics
3. **Updates**: Push to GitHub = auto-deploy to Netlify
4. **Height**: The iframe auto-adjusts, but you can set a fixed height if preferred

Need help? Check `/docs/AUTO_RESIZE_IFRAME.md` for advanced options.
