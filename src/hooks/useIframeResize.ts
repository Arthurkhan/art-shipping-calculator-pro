import { useEffect } from 'react';

export const useIframeResize = () => {
  useEffect(() => {
    // Function to send height to parent window
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      
      // Send to parent if we're in an iframe
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'resize',
          height: height
        }, '*'); // In production, replace '*' with your Squarespace domain
      }
    };

    // Send initial height
    sendHeight();

    // Create observer for content changes
    const resizeObserver = new ResizeObserver(() => {
      sendHeight();
    });

    // Observe the body for size changes
    resizeObserver.observe(document.body);

    // Also listen for any dynamic content changes
    const mutationObserver = new MutationObserver(() => {
      setTimeout(sendHeight, 100); // Small delay to ensure DOM is updated
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
};
