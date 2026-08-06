import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import CartSheet from "@/components/cart/CartSheet";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Index from "./pages/Index";
import Products from "./pages/Products";
import About from "./pages/About";
import HowToUse from "./pages/HowToUse";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Payment from "./pages/Payment";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import ReturnAndRefundPolicy from './pages/ReturnAndRefundPolicy';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CartSheet />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/products" element={<Products />} />
            <Route path="/about" element={<About />} />
            <Route path="/how-to-use" element={<HowToUse />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/checkout-success" element={<CheckoutSuccess />} />
            <Route path="/returnandrefundpolicy" element={<ReturnAndRefundPolicy />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Analytics />
        <SpeedInsights />
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
