# Squarespace Integration Guide for Art Shipping Calculator

This guide will help you integrate your shipping calculator into your Squarespace website at www.nazare-aga.com.

## Integration Options

### Option 1: Iframe Embedding (Recommended)
**Pros:** Simple, isolated, no conflicts
**Cons:** Fixed height, less seamless

### Option 2: Code Injection
**Pros:** More integrated appearance
**Cons:** Complex, potential style conflicts

### Option 3: Custom Code Block
**Pros:** Squarespace native
**Cons:** Limited functionality

## Step-by-Step Integration Guide

### Prerequisites
1. Deploy your app to a public URL (Lovable, Vercel, Netlify, etc.)
2. Ensure HTTPS is enabled on your deployment
3. Configure CORS if needed

### Method 1: Iframe Integration (Recommended)

#### Step 1: Deploy Your App
First, you need to deploy your app. Since you're using Lovable:
1. Open your [Lovable Project](https://lovable.dev/projects/907f737c-cafa-400a-acc5-64edd06ff12e)
2. Click on Share → Publish
3. Note your public URL

#### Step 2: Add to Squarespace
1. Log into your Squarespace admin panel
2. Navigate to the page where you want the calculator
3. Click "Edit" on the page
4. Add a "Code Block" where you want the calculator
5. Set the code type to "HTML"
6. Add this code:

```html
<div class="shipping-calculator-container">
  <iframe 
    src="YOUR_DEPLOYED_APP_URL" 
    width="100%" 
    height="800px" 
    frameborder="0"
    style="border: none; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
    title="Shipping Calculator">
  </iframe>
</div>

<style>
  .shipping-calculator-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  @media (max-width: 768px) {
    .shipping-calculator-container iframe {
      height: 1000px; /* Adjust for mobile */
    }
  }
</style>
```

#### Step 3: Make it Responsive
For better mobile experience, add this advanced version:

```html
<div id="shipping-calc-wrapper">
  <iframe 
    id="shipping-calculator"
    src="YOUR_DEPLOYED_APP_URL" 
    width="100%" 
    frameborder="0"
    scrolling="no"
    style="border: none; min-height: 800px;">
  </iframe>
</div>

<script>
  // Auto-resize iframe based on content
  window.addEventListener('message', function(e) {
    if (e.data.type === 'resize' && e.data.height) {
      document.getElementById('shipping-calculator').style.height = e.data.height + 'px';
    }
  });
</script>

<style>
  #shipping-calc-wrapper {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px 0;
  }
</style>
```

### Method 2: Direct Integration (Advanced)

If you want a more seamless integration, you can build and deploy your app as standalone JavaScript and CSS files.

#### Step 1: Modify Build Configuration
Update your `vite.config.ts` to build a library:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/main.tsx',
      name: 'ShippingCalculator',
      fileName: 'shipping-calculator',
      formats: ['iife']
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  }
})
```

#### Step 2: Create Squarespace Entry Point
Create `src/squarespace-entry.tsx`:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('art-shipping-calculator')
  if (container) {
    const root = ReactDOM.createRoot(container)
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  }
})
```

#### Step 3: Add to Squarespace
1. Build your app: `npm run build`
2. Upload the generated files to Squarespace's file storage or a CDN
3. In Squarespace, add this code block:

```html
<div id="art-shipping-calculator"></div>

<!-- Load your app -->
<link rel="stylesheet" href="URL_TO_YOUR_CSS_FILE">
<script src="URL_TO_YOUR_JS_FILE"></script>
```

### Method 3: Embed as a Button/Modal

For a less intrusive integration, add a button that opens the calculator in a modal:

```html
<button id="open-shipping-calc" class="sqs-block-button-element">
  Calculate Shipping
</button>

<div id="shipping-modal" style="display: none;">
  <div class="modal-overlay"></div>
  <div class="modal-content">
    <button class="close-modal">&times;</button>
    <iframe 
      src="YOUR_DEPLOYED_APP_URL" 
      width="100%" 
      height="600px" 
      frameborder="0">
    </iframe>
  </div>
</div>

<style>
  #shipping-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
  }
  
  .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
  }
  
  .modal-content {
    position: relative;
    max-width: 1000px;
    height: 80vh;
    margin: 5vh auto;
    background: white;
    border-radius: 8px;
    padding: 20px;
  }
  
  .close-modal {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
  }
</style>

<script>
  document.getElementById('open-shipping-calc').onclick = function() {
    document.getElementById('shipping-modal').style.display = 'block';
  }
  
  document.querySelector('.close-modal').onclick = function() {
    document.getElementById('shipping-modal').style.display = 'none';
  }
  
  document.querySelector('.modal-overlay').onclick = function() {
    document.getElementById('shipping-modal').style.display = 'none';
  }
</script>
```

## Important Considerations

### 1. CORS Configuration
If your app makes API calls to Supabase, ensure CORS is configured:
- Add your Squarespace domain to allowed origins in Supabase
- Add `https://www.nazare-aga.com` to your Supabase project's allowed URLs

### 2. Environment Variables
Make sure your production environment variables are set correctly:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3. SSL/HTTPS
Squarespace uses HTTPS, so your app must also be served over HTTPS.

### 4. Style Conflicts
To avoid CSS conflicts with Squarespace:
- Use CSS modules or styled-components
- Prefix your CSS classes
- Use shadow DOM if possible

### 5. Performance
- Optimize your bundle size
- Use code splitting
- Lazy load components

## Testing Your Integration

1. **Desktop Testing**
   - Chrome, Firefox, Safari, Edge
   - Different screen sizes

2. **Mobile Testing**
   - iOS Safari
   - Chrome on Android
   - Responsive design

3. **Functionality Testing**
   - All calculator features work
   - API calls succeed
   - Error handling works

## Troubleshooting

### Common Issues:

1. **Blank iframe**
   - Check console for errors
   - Verify HTTPS
   - Check CORS settings

2. **Style conflicts**
   - Use more specific CSS selectors
   - Add `!important` if necessary
   - Consider iframe isolation

3. **API errors**
   - Check network tab
   - Verify Supabase configuration
   - Check environment variables

### Debug Mode
Add this to your code block for debugging:

```javascript
// Add to your Squarespace code block
window.addEventListener('error', function(e) {
  console.error('Shipping Calculator Error:', e);
});
```

## Next Steps

1. Choose your integration method
2. Deploy your app
3. Test in Squarespace preview
4. Monitor for issues
5. Optimize based on usage

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify all URLs are correct
3. Ensure CORS is configured
4. Test in isolation first

For seamless integration, the iframe method is recommended as it provides the best balance of simplicity and functionality.
