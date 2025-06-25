import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // GitHub Pages configuration
  base: process.env.BASE_URL || '/art-shipping-calculator-pro/',
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production for security
    rollupOptions: {
      output: {
        // Optimize chunks for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-toast'],
          'supabase': ['@supabase/supabase-js'],
          'utils': ['date-fns', 'clsx', 'tailwind-merge'],
        },
      },
    },
    // Minimize for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
      },
    },
  },
  // Environment variable handling
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || ''),
    'import.meta.env.VITE_APP_URL': JSON.stringify(process.env.VITE_APP_URL || ''),
    'import.meta.env.VITE_ENABLE_DEBUG': JSON.stringify(process.env.VITE_ENABLE_DEBUG || 'false'),
    'import.meta.env.VITE_ENCRYPT_STORAGE': JSON.stringify(process.env.VITE_ENCRYPT_STORAGE || 'true'),
  },
}));
