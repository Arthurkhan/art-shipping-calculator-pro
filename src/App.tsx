import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useIframeResize } from "@/hooks/useIframeResize";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Lazy load route components for better performance
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Import loading component
import { PageLoader } from "@/components/ui/page-loader";

// Import Squarespace initializer to ensure dropdowns work properly
import "@/lib/squarespace-initializer";

// Configure QueryClient for optimal performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep cache for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Retry failed requests twice
      retry: 2,
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
      // Enable prefetching
      refetchOnMount: true,
    },
  },
});

const AppContent = () => {
  // Enable iframe auto-resize
  useIframeResize();

  return (
    <BrowserRouter basename="/art-shipping-calculator-pro">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
