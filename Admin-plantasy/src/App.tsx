import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Layout
import AdminLayout from "./components/layout/AdminLayout";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";

// Admin Pages
import DashboardPage from "./pages/dashboard/DashboardPage";
import ProductsPage from "./pages/products/ProductsPage";
import OrdersPage from "./pages/orders/OrdersPage";
import CouponsPage from "./pages/coupons/CouponsPage";
import BlogsPage from "./pages/blogs/BlogsPage";
import ReviewsPage from "./pages/reviews/ReviewsPage";
import SupportPage from "./pages/support/SupportPage";
import AdminUsersPage from "./pages/admin-users/AdminUsersPage";
import CategoriesPage from "./pages/categories/CategoriesPage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <><QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/auth/login" element={<LoginPage />} />

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Admin Routes - Protected by AdminLayout */}
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/coupons" element={<CouponsPage />} />
              <Route path="/blogs" element={<BlogsPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/admin-users" element={<AdminUsersPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider></>
);

export default App;
