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

### Step 2: Add the Calculator
1. Edit your new page
2. Click **+** → **Code**
3. Paste this code (replace the URL!):

```html
<div style="width: 100%; max-width: 1200px; margin: 0 auto;">
  <iframe 
    src="https://YOUR-APP-NAME.netlify.app" 
    width="100%" 
    height="900px"
    style="border: none;"
    title="Shipping Calculator">
  </iframe>
</div>
```

4. **Important**: Replace `YOUR-APP-NAME` with your actual Netlify URL
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

---

## 🛠️ Troubleshooting

### Calculator not showing?
- Check if your Netlify site works directly
- Make sure you replaced the URL in the iframe code
- Check browser console for errors (F12)

### Need different height?
Change `height="900px"` to your preferred height

### Want a button instead?
Use this code for a popup button:

```html
<button class="sqs-block-button-element--medium" 
        onclick="window.open('https://YOUR-APP-NAME.netlify.app', 'shipping', 'width=1000,height=800')">
  Calculate Shipping
</button>
```

---

## 📱 Mobile Optimization

For better mobile experience, update the iframe code:

```html
<div style="width: 100%; max-width: 1200px; margin: 0 auto;">
  <iframe 
    src="https://YOUR-APP-NAME.netlify.app" 
    width="100%" 
    height="900px"
    style="border: none;"
    title="Shipping Calculator">
  </iframe>
</div>

<style>
@media (max-width: 768px) {
  iframe {
    height: 1200px !important;
  }
}
</style>
```

---

## 🔐 Security Note

Your calculator is secure because:
- It runs in an isolated iframe
- Uses HTTPS
- Has proper CORS configuration
- Supabase handles authentication

---

## 💡 Pro Tips

1. **Custom Domain**: In Netlify, you can set up `shipping.nazare-aga.com`
2. **Analytics**: Netlify provides free analytics
3. **Updates**: Push to GitHub = auto-deploy to Netlify

Need help? Your app is now:
- ✅ Deployed on Netlify
- ✅ Embedded in Squarespace
- ✅ Fully functional
- ✅ Mobile responsive
