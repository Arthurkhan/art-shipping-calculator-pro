// Register Service Worker for offline support

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Only register in production
      if (import.meta.env.PROD) {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // Service Worker registered successfully

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                // New service worker available
                // You could show a notification to the user here
              }
            });
          }
        });
      }
    } catch (error) {
      // Service Worker registration failed
    }
  }
};