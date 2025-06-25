import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useIframeResize } from "@/hooks/useIframeResize";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Import Squarespace initializer to ensure dropdowns work properly
import "@/lib/squarespace-initializer";

const queryClient = new QueryClient();

const AppContent = () => {
  // Enable iframe auto-resize
  useIframeResize();

  return (
    <BrowserRouter basename="/art-shipping-calculator-pro">
      <Routes>
        <Route path="/" element={<Index />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
