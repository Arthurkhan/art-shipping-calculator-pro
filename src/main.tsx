import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// import { registerServiceWorker } from './lib/register-sw'

// Temporarily disabled service worker to debug deployment issues
// registerServiceWorker();

// Check for required environment variables
if (!import.meta.env.VITE_SUPABASE_URL) {
  console.error('⚠️ Missing VITE_SUPABASE_URL environment variable');
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error('⚠️ Missing VITE_SUPABASE_ANON_KEY environment variable');
}

console.log('🚀 App starting with base URL:', import.meta.env.BASE_URL);

createRoot(document.getElementById("root")!).render(<App />);
