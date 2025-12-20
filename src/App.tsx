import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from 'react-helmet-async';
import { lazy, Suspense, useEffect } from 'react';
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { WishlistProvider } from "@/context/WishlistContext";
import Index from "./pages/Index";
import Catalog from "./pages/Catalog";
import Drop from "./pages/Drop";
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
import Categories from "./pages/Categories";
import SubCategories from "./pages/SubCategories";
import CategoryPage from "./pages/CategoryPage";
import CommunityPage from "./pages/CommunityPage";
import NotFound from "./pages/NotFound";
import ComingSoon from "./pages/ComingSoon";
import Arena from "./pages/Arena";
import ArenaLobby from "./pages/ArenaLobby";
import ArenaSubmit from "./pages/ArenaSubmit";
import ArenaRules from "./pages/ArenaRules";
import About from "./pages/About";
import Onboarding from "./pages/onboarding/Onboarding"; // Imported Onboarding

// Admin Imports
import DropAdminLayout from "./layouts/DropAdminLayout";
import DropDashboard from "./pages/admin/drop/DropDashboard";
import DropEditor from "./pages/admin/drop/DropEditor";
import WaitlistManager from "./pages/admin/drop/WaitlistManager";
import UGCModeration from "./pages/admin/drop/UGCModeration";
import Shipping from "./pages/Shipping";
import Terms from "./pages/Terms";
import Returns from "./pages/Returns";
import Privacy from "./pages/Privacy";
import FAQ from "./pages/FAQ";
import Cookies from "./pages/Cookies";

import ReturnManager from "./components/admin/ReturnManager";
import CommunityManager from "./components/admin/CommunityManager";
import BundleManager from "./components/admin/BundleManager";
import AdminLayout from "./components/admin/layout/AdminLayout";
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ActivityLogs = lazy(() => import('./pages/admin/ActivityLogs'));
const ProductManager = lazy(() => import('./components/admin/ProductManager'));
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
import BrandKitManager from "./components/admin/BrandKitManager";
import MediaLibrary from "./components/admin/MediaLibrary";
import CampaignBuilder from "./components/admin/CampaignBuilder";
import BroadcastManager from "./components/admin/BroadcastManager";
import AnnouncementBar from "./components/AnnouncementBar";

const queryClient = new QueryClient();

const LaunchGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const targetDate = new Date('2025-12-25T00:00:00');
  const now = new Date();
  const isPreLaunch = now < targetDate;
  // const isPreLaunch = false; // Disabled for SEO Indexing
  const isBypassed = localStorage.getItem('mtrix_bypass') === 'true';

  // Whitelisted paths that are always accessible
  const publicPaths = [
    '/auth',
    '/onboarding', // Allow access so authenticated users can see it (LaunchGuard passes through, Onboarding checks user)
    '/shipping',
    '/terms',
    '/returns',
    '/privacy',
    '/cookies',
    '/faq',
    '/support',
    '/admin' // Admin routes handle their own auth
  ];

  const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));

  // Check for OAuth redirect hash
  const isOAuthCallback = window.location.hash.includes('access_token') ||
    window.location.hash.includes('refresh_token') ||
    window.location.hash.includes('error');

  // Allow access if:
  // 1. It's not pre-launch (site is live)
  // 2. User has bypassed via secret code
  // 3. User is on a public/legal page
  // 4. User is an Admin (checked via email or role - placeholder logic)
  const userEmail = user?.email?.toLowerCase();
  const authorizedEmails = ['raj00.mkv@gmail.com', 'admin.gamma@mtrix.store'];
  const isAuthorizedUser = userEmail && authorizedEmails.includes(userEmail);

  if (loading || isOAuthCallback) return <div className="min-h-screen bg-black" />; // Prevent flash & allow OAuth to process

  if (isPreLaunch && !isBypassed && !isPublicPath && !isAuthorizedUser) {
    return <Navigate to="/coming-soon" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WishlistProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AnnouncementBar />
            <Routes>
              <Route path="/coming-soon" element={<ComingSoon />} />
              <Route path="/about" element={<About />} />

              <Route path="/" element={<LaunchGuard><Index /></LaunchGuard>} />
              <Route path="/catalog" element={<LaunchGuard><Catalog /></LaunchGuard>} />
              <Route path="/drop" element={<LaunchGuard><Drop /></LaunchGuard>} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/collections/:slug" element={<CategoryPage />} />
              <Route path="/categories" element={<LaunchGuard><Categories /></LaunchGuard>} />
              <Route path="/categories/:slug" element={<LaunchGuard><SubCategories /></LaunchGuard>} />
              <Route path="/bundles" element={<Bundles />} />
              <Route path="/bundle/:id" element={<BundleDetail />} />
              <Route path="/promotions" element={<LaunchGuard><Promotions /></LaunchGuard>} />
              <Route path="/support" element={<LaunchGuard><Support /></LaunchGuard>} />
              <Route path="/product/:id" element={<LaunchGuard><Product /></LaunchGuard>} />
              <Route path="/cart" element={<LaunchGuard><Cart /></LaunchGuard>} />
              <Route path="/checkout" element={<LaunchGuard><Checkout /></LaunchGuard>} />
              <Route path="/auth" element={<LaunchGuard><Auth /></LaunchGuard>} />
              <Route path="/onboarding" element={<LaunchGuard><Onboarding /></LaunchGuard>} /> {/* Added Onboarding Route */}
              <Route path="/profile" element={<LaunchGuard><Profile /></LaunchGuard>} />
              <Route path="/wishlist" element={<LaunchGuard><Wishlist /></LaunchGuard>} />
              <Route path="/my-orders" element={<LaunchGuard><MyOrders /></LaunchGuard>} />
              <Route path="/order/:id" element={<LaunchGuard><OrderDetail /></LaunchGuard>} />

              {/* MTRIX ARENA Routes */}
              <Route path="/arena" element={<Arena />} />
              <Route path="/arena/lobby" element={<ArenaLobby />} />
              <Route path="/arena/submit" element={<LaunchGuard><ArenaSubmit /></LaunchGuard>} />
              <Route path="/arena/rules" element={<ArenaRules />} />

              {/* Legal & Support Pages */}
              <Route path="/shipping" element={<LaunchGuard><Shipping /></LaunchGuard>} />
              <Route path="/terms" element={<LaunchGuard><Terms /></LaunchGuard>} />
              <Route path="/returns" element={<LaunchGuard><Returns /></LaunchGuard>} />
              <Route path="/privacy" element={<LaunchGuard><Privacy /></LaunchGuard>} />
              <Route path="/cookies" element={<LaunchGuard><Cookies /></LaunchGuard>} />
              <Route path="/faq" element={<LaunchGuard><FAQ /></LaunchGuard>} />

              {/* Main Admin Routes - No Guard Needed (handled by AdminAuth) */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="logs" element={<ActivityLogs />} />
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
                <Route path="returns" element={<ReturnManager />} />
                <Route path="community" element={<CommunityManager />} />
                <Route path="bundles" element={<BundleManager />} />
                <Route path="reviews" element={<ReviewManager />} />
                <Route path="designs" element={<DesignManager />} />
                <Route path="settings" element={<SiteSettingsManager />} />
                <Route path="brand-kit" element={<BrandKitManager />} />
                <Route path="media" element={<MediaLibrary />} />
                <Route path="campaigns" element={<CampaignBuilder />} />
                <Route path="broadcasts" element={<BroadcastManager />} />
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
      </WishlistProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
