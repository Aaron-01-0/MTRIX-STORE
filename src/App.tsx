import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Catalog from "./pages/Catalog";
import Bundles from "./pages/Bundles";
import BundleDetail from "./pages/BundleDetail";
import Promotions from "./pages/Promotions";
import Support from "./pages/Support";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";
import MyOrders from "./pages/MyOrders";
import OrderDetail from "./pages/OrderDetail";
import Admin from "./pages/Admin";
import AdminAuth from "./pages/AdminAuth";
import Categories from "./pages/Categories";
import NotFound from "./pages/NotFound";
import Themes from "./pages/Themes";
import FlexDesign from "./pages/FlexDesign";
import MyCustomOrders from "./pages/MyCustomOrders";
import Drop from "./pages/Drop";
import DropAdminLayout from "./layouts/DropAdminLayout";
import DropDashboard from "./pages/admin/drop/DropDashboard";
import DropEditor from "./pages/admin/drop/DropEditor";
import WaitlistManager from "./pages/admin/drop/WaitlistManager";
import UGCModeration from "./pages/admin/drop/UGCModeration";

// New Admin Imports
import AdminLayout from "./components/admin/layout/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProductManager from "./components/admin/ProductManager";
import InventoryManager from "./components/admin/InventoryManager";
import OrderLayout from "./components/admin/orders/OrderLayout";
import OrderList from "./components/admin/orders/OrderList";
import AdminOrderDetail from "./components/admin/orders/OrderDetail";
import PaymentManager from "./components/admin/PaymentManager";
import ContentManagerWrapper from "./components/admin/ContentManagerWrapper";
import SupportManager from "./components/admin/SupportManager";
import SocialContentManager from "./components/admin/SocialContentManager";
import CouponManager from "./components/admin/CouponManager";
import UserManager from "./components/admin/UserManager";
import ReviewManager from "./components/admin/ReviewManager";
import DesignManager from "./components/admin/DesignManager";
import SiteSettingsManager from "./components/admin/SiteSettingsManager";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/bundles" element={<Bundles />} />
            <Route path="/bundle/:id" element={<BundleDetail />} />
            <Route path="/promotions" element={<Promotions />} />
            <Route path="/support" element={<Support />} />
            <Route path="/product/:id" element={<Product />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/order/:id" element={<OrderDetail />} />
            {/* Main Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="products" element={<ProductManager />} />
              <Route path="inventory" element={<InventoryManager />} />
              <Route path="orders" element={<OrderLayout />}>
                <Route index element={<OrderList />} />
                <Route path=":id" element={<AdminOrderDetail />} />
              </Route>
              <Route path="payments" element={<PaymentManager />} />
              <Route path="content" element={<ContentManagerWrapper />} />
              <Route path="support" element={<SupportManager />} />
              <Route path="social" element={<SocialContentManager />} />
              <Route path="coupons" element={<CouponManager />} />
              <Route path="users" element={<UserManager />} />
              <Route path="support" element={<SupportManager />} />
              <Route path="reviews" element={<ReviewManager />} />
              <Route path="designs" element={<DesignManager />} />
              <Route path="settings" element={<SiteSettingsManager />} />
              <Route path="social" element={<SocialContentManager />} />
            </Route>

            {/* Drop Admin Routes */}
            <Route path="/admin/drops" element={<DropAdminLayout />}>
              <Route index element={<Navigate to="/admin/drops/dashboard" replace />} />
              <Route path="dashboard" element={<DropDashboard />} />
              <Route path="editor" element={<DropEditor />} />
              <Route path="waitlist" element={<WaitlistManager />} />
              <Route path="ugc" element={<UGCModeration />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
