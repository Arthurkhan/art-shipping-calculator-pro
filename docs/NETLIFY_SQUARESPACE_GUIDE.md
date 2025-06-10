# Netlify Deployment & Squarespace Integration Guide

This guide will help you deploy your shipping calculator to Netlify and integrate it into a dedicated page on your Squarespace website.

## Part 1: Deploy to Netlify

### Step 1: Prepare for Deployment

1. **Create a Netlify account** (if you don't have one)
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub for easier integration

2. **Add environment variables file**
   Create a `.env.production` file in your project root:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Step 2: Deploy via GitHub (Recommended)

1. **Connect GitHub to Netlify**
   - In Netlify dashboard, click "Add new site" → "Import an existing project"
   - Choose "Deploy with GitHub"
   - Select your repository: `art-shipping-calculator-pro`

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Click "Show advanced" → "New variable"
   - Add your environment variables:
     - `VITE_SUPABASE_URL` = [your supabase url]
     - `VITE_SUPABASE_ANON_KEY` = [your supabase anon key]

3. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete (2-3 minutes)
   - You'll get a URL like: `https://amazing-name-123.netlify.app`

### Step 3: Configure Custom Domain (Optional)
1. In Netlify, go to "Domain settings"
2. Add a custom domain like `shipping.nazare-aga.com`
3. Or use the provided Netlify subdomain

### Step 4: Configure CORS in Supabase
**Important**: Add your Netlify URL to Supabase allowed origins

1. Go to your Supabase project
2. Navigate to **Authentication** → **URL Configuration**
3. Add to "Redirect URLs":
   - Your Netlify URL: `https://your-site.netlify.app`
   - Your Squarespace domain: `https://www.nazare-aga.com`

## Part 2: Create Dedicated Page in Squarespace

### Step 1: Create a New Page

1. **Login to Squarespace**
   - Go to your site dashboard

2. **Add a New Page**
   - Navigate to **Pages**
   - Click the **+** icon to add a new page
   - Choose **Blank Page** (not "Link")
   - Name it something like "Shipping Calculator" or "Calculate Shipping"

3. **Configure Page Settings**
   - Click the gear icon next to your new page
   - URL Slug: `/shipping-calculator` (or your preference)
   - Navigation Title: "Shipping Calculator"
   - Page Title: "Art Shipping Calculator"

### Step 2: Add the Calculator to the Page

1. **Edit the Page**
   - Click on your new page to edit it
   - Remove any default content blocks

2. **Add a Code Block**
   - Click the **+** icon to add a new block
   - Choose **Code** from the menu
   - Make sure it's set to **HTML**

3. **Insert the Iframe Code**
   ```html
   <div class="shipping-calculator-wrapper">
     <iframe 
       id="shipping-calc"
       src="https://your-site.netlify.app" 
       width="100%" 
       height="900px"
       frameborder="0"
       style="border: none; max-width: 100%; overflow: hidden;"
       title="Art Shipping Calculator">
     </iframe>
   </div>

   <style>
     /* Responsive wrapper */
     .shipping-calculator-wrapper {
       width: 100%;
       max-width: 1200px;
       margin: 0 auto;
       padding: 20px 0;
     }
     
     /* Mobile responsive */
     @media (max-width: 768px) {
       #shipping-calc {
         height: 1200px; /* Adjust based on your app's mobile height */
       }
     }
     
     /* Remove any extra spacing */
     .shipping-calculator-wrapper iframe {
       display: block;
     }
   </style>

   <script>
     // Optional: Auto-resize based on content
     window.addEventListener('message', function(e) {
       if (e.origin !== 'https://your-site.netlify.app') return;
       
       if (e.data.type === 'resize' && e.data.height) {
         document.getElementById('shipping-calc').style.height = e.data.height + 'px';
       }
     });
   </script>
   ```

4. **Replace the URL**
   - Change `https://your-site.netlify.app` to your actual Netlify URL
   - Update it in both the `src` attribute and the script

### Step 3: Style the Page (Optional)

1. **Add a Header Section** (above the code block)
   - Add a text block with introduction text:
   ```
   Calculate shipping costs for your artwork instantly. 
   Enter your shipping details below to get accurate FedEx rates.
   ```

2. **Add Custom CSS** (in Design → Custom CSS)
   ```css
   /* Style the shipping calculator page */
   #collection-YOUR-PAGE-ID .content-wrapper {
     max-width: 1200px;
   }
   
   /* Remove padding on mobile */
   @media (max-width: 640px) {
     #collection-YOUR-PAGE-ID .content-wrapper {
       padding: 0 20px;
     }
   }
   ```

### Step 4: Add to Navigation

1. **Main Navigation**
   - Go to **Pages**
   - Drag your "Shipping Calculator" page to your main navigation
   - Or place it in a folder/dropdown menu

2. **Footer Link** (Optional)
   - Go to **Design** → **Footer**
   - Add a link to `/shipping-calculator`

## Part 3: Testing & Optimization

### Test Your Integration

1. **Desktop Testing**
   - Visit your page on different browsers
   - Ensure calculator loads properly
   - Test all functionality

2. **Mobile Testing**
   - Check on actual mobile devices
   - Verify responsive design
   - Test touch interactions

3. **Cross-Origin Testing**
   - Ensure Supabase calls work
   - Check for any CORS errors in console

### Optimize Performance

1. **Add Loading State**
   ```html
   <div class="shipping-calculator-wrapper">
     <div id="loading-message" style="text-align: center; padding: 50px;">
       <p>Loading shipping calculator...</p>
     </div>
     <iframe 
       id="shipping-calc"
       src="https://your-site.netlify.app" 
       width="100%" 
       height="900px"
       frameborder="0"
       style="border: none; display: none;"
       onload="document.getElementById('loading-message').style.display='none'; this.style.display='block';"
       title="Art Shipping Calculator">
     </iframe>
   </div>
   ```

2. **Preconnect to Speed Loading**
   Add to your Squarespace header injection:
   ```html
   <link rel="preconnect" href="https://your-site.netlify.app">
   <link rel="dns-prefetch" href="https://your-site.netlify.app">
   ```

## Quick Implementation Checklist

- [ ] Deploy to Netlify with environment variables
- [ ] Note your Netlify URL
- [ ] Add Netlify URL to Supabase CORS settings
- [ ] Create new page in Squarespace
- [ ] Add code block with iframe
- [ ] Update iframe src to your Netlify URL
- [ ] Test on desktop and mobile
- [ ] Add page to navigation
- [ ] Style as needed

## Troubleshooting

### Calculator not loading?
1. Check browser console for errors
2. Verify Netlify deployment succeeded
3. Ensure CORS is configured in Supabase
4. Try visiting Netlify URL directly

### Height issues?
- Adjust the `height` value in the iframe
- Use the auto-resize script
- Set different heights for mobile/desktop

### Style conflicts?
- The iframe isolates your app's styles
- Squarespace styles won't affect the calculator
- Only the wrapper styling matters

## Alternative: Modal Popup

If you prefer a button that opens the calculator in a popup:

```html
<button id="open-calculator" class="sqs-block-button-element--medium">
  Calculate Shipping Cost
</button>

<div id="calc-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999;">
  <div style="position: relative; width: 90%; max-width: 1000px; height: 90%; margin: 5% auto; background: white; border-radius: 8px; overflow: hidden;">
    <button onclick="document.getElementById('calc-modal').style.display='none'" style="position: absolute; top: 10px; right: 10px; z-index: 10000; background: white; border: none; font-size: 30px; cursor: pointer;">&times;</button>
    <iframe src="https://your-site.netlify.app" width="100%" height="100%" frameborder="0"></iframe>
  </div>
</div>

<script>
document.getElementById('open-calculator').onclick = function() {
  document.getElementById('calc-modal').style.display = 'block';
}
</script>
```

## Success! 🎉

Your shipping calculator will now be:
- Hosted reliably on Netlify
- Integrated seamlessly into your Squarespace site
- Available at www.nazare-aga.com/shipping-calculator
- Maintaining your existing website unchanged
