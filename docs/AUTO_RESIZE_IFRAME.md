# Auto-Resizing Iframe for Squarespace

This code automatically adjusts the iframe height based on your app's content, preventing any cutoff issues.

## Updated Squarespace Code

Replace your current iframe code with this enhanced version:

```html
<!-- Auto-resizing iframe container -->
<div id="shipping-calc-container" style="width: 100%; max-width: 1200px; margin: 0 auto;">
  <!-- Loading message while iframe loads -->
  <div id="calc-loading" style="text-align: center; padding: 40px; color: #666;">
    <p>Loading shipping calculator...</p>
  </div>
  
  <!-- The iframe (initially hidden) -->
  <iframe 
    id="shipping-calculator-iframe"
    src="https://YOUR-NETLIFY-URL.netlify.app" 
    width="100%" 
    height="800px"
    frameborder="0"
    scrolling="no"
    style="border: none; display: none; transition: height 0.3s ease;"
    title="Art Shipping Calculator">
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
  
  // Listen for resize messages from the iframe
  window.addEventListener('message', function(e) {
    // Security: Check origin (replace with your Netlify URL)
    // if (e.origin !== 'https://YOUR-NETLIFY-URL.netlify.app') return;
    
    if (e.data && e.data.type === 'resize' && e.data.height) {
      // Add some padding to ensure nothing is cut off
      const newHeight = parseInt(e.data.height) + 50;
      iframe.style.height = newHeight + 'px';
    }
  });
  
  // Fallback: If no resize message received, ensure minimum height
  setTimeout(function() {
    if (iframe.style.height === '800px') {
      iframe.style.height = '1200px';
    }
  }, 3000);
})();
</script>

<style>
/* Optional: Add custom styling */
#shipping-calc-container {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
}

/* Mobile responsive */
@media (max-width: 768px) {
  #shipping-calc-container {
    padding: 10px;
  }
}
</style>
```

## Important: Update the URL

Remember to replace `YOUR-NETLIFY-URL` with your actual Netlify URL in:
1. The iframe `src` attribute
2. The security check in the JavaScript (optional but recommended)

## How It Works

1. **Initial Load**: Shows a loading message while the iframe loads
2. **Auto-Resize**: The app sends its height to the parent window
3. **Dynamic Updates**: When content changes (like showing results), the height adjusts automatically
4. **Smooth Transitions**: CSS transitions make height changes smooth
5. **Fallback**: If auto-resize fails, sets a larger default height

## Testing

After adding this code:
1. Load the page and verify the calculator appears
2. Fill out the form and calculate shipping
3. The iframe should expand to show all results
4. No scrollbars should appear within the iframe
5. All content should be visible

## Troubleshooting

### Still seeing cutoff content?
1. Check browser console for any errors
2. Verify the Netlify URL is correct
3. Try increasing the padding in the resize handler (change `+ 50` to `+ 100`)

### Height not adjusting?
1. Make sure you've deployed the latest code to Netlify
2. Clear your browser cache
3. Check that JavaScript is enabled in Squarespace

### Security Note
For production, uncomment the origin check and replace with your actual Netlify URL to ensure only your app can resize the iframe.

## Alternative: Fixed Large Height

If you prefer a simpler solution without auto-resize:

```html
<div style="width: 100%; max-width: 1200px; margin: 0 auto;">
  <iframe 
    src="https://YOUR-NETLIFY-URL.netlify.app" 
    width="100%" 
    height="1500px"
    frameborder="0"
    scrolling="no"
    style="border: none;"
    title="Art Shipping Calculator">
  </iframe>
</div>
```

This sets a fixed height large enough for all content, but may leave empty space.
