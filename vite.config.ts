import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Determine base URL based on build target
  const isSquarespaceBuild = process.env.BUILD_TARGET === 'squarespace';
  const baseUrl = isSquarespaceBuild 
    ? 'https://fedexcalculator.netlify.app/' // Your Netlify URL
    : '/';
  
  return {
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
    // Use dynamic base URL for different deployment targets
    base: baseUrl,
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-toast'],
          'supabase': ['@supabase/supabase-js'],
          'utils': ['date-fns', 'clsx', 'tailwind-merge'],
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs to debug production issues
        drop_debugger: true,
      },
    },
  },
  };
});