# Fixed: Auto-Resizing Iframe (No More Infinite Growth!)

The infinite growth issue has been fixed. Use this updated Squarespace code:

## Updated Squarespace Code (Copy & Paste This)

```html
<!-- Auto-resizing iframe container -->
<div id="shipping-calc-container" style="width: 100%; max-width: 1200px; margin: 0 auto;">
  <!-- Loading message -->
  <div id="calc-loading" style="text-align: center; padding: 40px; color: #666;">
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
    style="border: none; display: none; transition: height 0.3s ease;"
    title="Shipping Calculator">
  </iframe>
</div>

<script>
(function() {
  const iframe = document.getElementById('shipping-calculator-iframe');
  const loading = document.getElementById('calc-loading');
  let lastHeight = 800;
  let resizeCount = 0;
  
  // Show iframe when loaded
  iframe.onload = function() {
    loading.style.display = 'none';
    iframe.style.display = 'block';
  };
  
  // Auto-resize based on content
  window.addEventListener('message', function(e) {
    // Optional: Add origin check for security
    // if (e.origin !== 'https://YOUR-NETLIFY-URL.netlify.app') return;
    
    if (e.data && e.data.type === 'resize' && e.data.height) {
      const newHeight = parseInt(e.data.height);
      
      // Sanity checks to prevent infinite growth
      if (newHeight > 100 && newHeight < 5000) { // Min 100px, Max 5000px
        // Only update if height changed significantly (more than 10px)
        if (Math.abs(newHeight - lastHeight) > 10) {
          const adjustedHeight = newHeight + 50; // Add padding
          iframe.style.height = adjustedHeight + 'px';
          lastHeight = newHeight;
          resizeCount++;
          
          // Optional: Log for debugging
          // console.log(`Resize #${resizeCount}: ${adjustedHeight}px`);
        }
      }
    }
  });
  
  // Fallback: Set reasonable height if no resize messages
  setTimeout(function() {
    if (resizeCount === 0) {
      iframe.style.height = '1200px';
    }
  }, 5000);
})();
</script>

<style>
/* Optional: Better styling */
#shipping-calc-container {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 40px;
}

@media (max-width: 768px) {
  #shipping-calc-container {
    padding: 10px;
  }
}
</style>
```

## What Was Fixed:

1. **Debouncing**: Only sends height updates when content actually changes
2. **Height Tracking**: Remembers last height to avoid unnecessary updates
3. **Tolerance**: Only updates if height changes by more than 5-10 pixels
4. **Maximum Height**: Sets a 5000px maximum to prevent runaway growth
5. **Smart Detection**: Only observes actual content changes, not scrolling

## Deploy the Fix:

1. **The app code is already updated** - Just push to GitHub
2. **Netlify will auto-deploy** the changes (takes 2-3 minutes)
3. **Update your Squarespace code** with the version above
4. **Test it** - The height should now adjust properly without infinite growth

## Alternative: Fixed Height (Simpler)

If you still have issues, use a generous fixed height:

```html
<div style="width: 100%; max-width: 1200px; margin: 0 auto;">
  <iframe 
    src="https://YOUR-NETLIFY-URL.netlify.app" 
    width="100%" 
    height="1400px"
    frameborder="0"
    style="border: none;">
  </iframe>
</div>
```

## Debug Mode

To see what's happening, uncomment the console.log line in the code above. It will show:
- How many times the height adjusted
- What the new height is each time

The fix ensures:
- ✅ No infinite growth
- ✅ Proper content display
- ✅ Smooth transitions
- ✅ Mobile responsive
- ✅ No scrollbars

Remember to replace `YOUR-NETLIFY-URL` with your actual URL!
