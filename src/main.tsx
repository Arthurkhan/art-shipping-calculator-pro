import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Unregister all service workers and clear caches to fix stale cache issues
if ('serviceWorker' in navigator) {
  // Get all service worker registrations
  navigator.serviceWorker.getRegistrations().then(registrations => {
    // Unregister each service worker
    registrations.forEach(registration => {
      registration.unregister().then(success => {
        if (success) {
          console.log('✅ Service worker unregistered successfully');
        }
      });
    });
  });
  
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName).then(success => {
          if (success) {
            console.log(`✅ Cache "${cacheName}" deleted`);
          }
        });
      });
    });
  }
}

// Check for required environment variables
if (!import.meta.env.VITE_SUPABASE_URL) {
  console.error('⚠️ Missing VITE_SUPABASE_URL environment variable');
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error('⚠️ Missing VITE_SUPABASE_ANON_KEY environment variable');
}

console.log('🚀 App starting with base URL:', import.meta.env.BASE_URL);

createRoot(document.getElementById("root")!).render(<App />);
