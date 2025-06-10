import { useEffect, useRef } from 'react';

export const useIframeResize = () => {
  const lastHeightRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Function to send height to parent window
    const sendHeight = () => {
      // Get the actual content height
      const body = document.body;
      const html = document.documentElement;
      
      // Calculate the actual height of the content
      const height = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      );
      
      // Only send if height actually changed (with 5px tolerance)
      if (Math.abs(height - lastHeightRef.current) > 5) {
        lastHeightRef.current = height;
        
        // Send to parent if we're in an iframe
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'resize',
            height: height
          }, '*');
        }
      }
    };

    // Debounced version to prevent too many updates
    const debouncedSendHeight = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        sendHeight();
      }, 100); // Wait 100ms after last change
    };

    // Send initial height after a short delay to ensure content is rendered
    setTimeout(sendHeight, 100);

    // Create observer for content changes
    const resizeObserver = new ResizeObserver((entries) => {
      // Only trigger if the size actually changed
      for (const entry of entries) {
        const { height } = entry.contentRect;
        if (Math.abs(height - lastHeightRef.current) > 5) {
          debouncedSendHeight();
        }
      }
    });

    // Observe only the main content container, not the entire body
    const mainContent = document.getElementById('root') || document.body;
    resizeObserver.observe(mainContent);

    // Also listen for specific events that might change height
    const handleContentChange = () => debouncedSendHeight();
    
    // Listen for images loading
    window.addEventListener('load', handleContentChange);
    
    // Listen for dynamic content changes (but not scroll events!)
    const mutationObserver = new MutationObserver(() => {
      debouncedSendHeight();
    });

    mutationObserver.observe(mainContent, {
      childList: true,
      subtree: true,
      attributes: false, // Don't watch attribute changes
      characterData: false // Don't watch text changes
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('load', handleContentChange);
    };
  }, []);
};
