import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { ThemeProvider } from "next-themes";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Packs from "./pages/Packs";
import PackDetail from "./pages/PackDetail";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminActivityLog from "./pages/admin/AdminActivityLog";
import AdminShipping from "./pages/admin/AdminShipping";
import AdminPacks from "./pages/admin/AdminPacks";
import AdminMarketing from "./pages/admin/AdminMarketing";
import AdminContent from "./pages/admin/AdminContent";
                    <Route path="content" element={<AdminContent />} />
                    <Route path="activity" element={<AdminActivityLog />} />
                  </Route >

  {/* Catch-all */ }
  < Route path = "*" element = {< NotFound />} />
                </Routes >
              </LanguageProvider >
            </AuthProvider >
          </BrowserRouter >
          <SpeedInsights />
          <Analytics />
        </TooltipProvider >
      </QueryClientProvider >
    </ThemeProvider >
  </HelmetProvider >
);

export default App;
