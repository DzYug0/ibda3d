import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { ThemeProvider } from "next-themes";
// import { SpeedInsights } from "@vercel/speed-insights/react";
// import { Analytics } from "@vercel/analytics/react";
import LegalPage from "./pages/LegalPage";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Packs from "./pages/Packs";
import PackDetail from "./pages/PackDetail";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminShipping from "./pages/admin/AdminShipping";
import AdminPacks from "./pages/admin/AdminPacks";
import AdminMarketing from "./pages/admin/AdminMarketing";
import AdminContent from "./pages/admin/AdminContent";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminActivityLog from "./pages/admin/AdminActivityLog";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import ScrollToTop from "./components/ScrollToTop";
import { HelmetProvider } from "react-helmet-async";
import { FacebookPixel } from "./components/analytics/FacebookPixel";
import { AnalyticsTracker } from "./components/analytics/AnalyticsTracker";

const queryClient = new QueryClient();

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <ScrollToTop />
          <FacebookPixel />
          <AnalyticsTracker />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/policy" element={<LegalPage slug="privacy" />} />
            <Route path="/terms" element={<LegalPage slug="terms" />} />
            <Route path="/products" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/packs" element={<Packs />} />
            <Route path="/packs/:slug" element={<PackDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/wishlist" element={<Wishlist />} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="shipping" element={<AdminShipping />} />
              <Route path="packs" element={<AdminPacks />} />
              <Route path="marketing" element={<AdminMarketing />} />
              <Route path="content" element={<AdminContent />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="activity" element={<AdminActivityLog />} />
              <Route path="analytics" element={<AdminAnalytics />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
    {/* <SpeedInsights /> */}
    {/* <Analytics /> */}
  </TooltipProvider>
      </QueryClientProvider >
    </ThemeProvider >
  </HelmetProvider >
);

export default App;
