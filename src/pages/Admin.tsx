import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Image as ImageIcon,
  Tag,
  Ticket,
  MessageSquare,
  Star,
  Palette,
  Zap,
  Instagram,
  AlertTriangle,
  CreditCard,
  Users,
  HelpCircle
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductManager from '@/components/admin/ProductManager';
import CategoryManager from '@/components/admin/CategoryManager';
import BundleManager from '@/components/admin/BundleManager';
import HeroImageManager from '@/components/admin/HeroImageManager';
import CategoryImageManager from '@/components/admin/CategoryImageManager';
import OrderManager from '@/components/admin/OrderManager';
import CouponManager from '@/components/admin/CouponManager';
import SupportManager from '@/components/admin/SupportManager';
import PromotionStripManager from '@/components/admin/PromotionStripManager';
import ReviewManager from '@/components/admin/ReviewManager';
import DesignManager from '@/components/admin/DesignManager';
import SocialMediaManager from '@/components/admin/SocialMediaManager';
import PaymentManager from '@/components/admin/PaymentManager';
import { LowStockAlerts } from '@/components/admin/LowStockAlerts';
import UserManager from '@/components/admin/UserManager';
import SiteSettingsManager from '@/components/admin/SiteSettingsManager';
import DropManager from '@/components/admin/DropManager';
import SocialContentManager from '@/components/admin/SocialContentManager';
import { useToast } from '@/hooks/use-toast';

interface HeroImageData {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  alt_text: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [heroImages, setHeroImages] = useState<Array<{ url: string; title?: string; subtitle?: string; alt?: string }>>([]);

  useEffect(() => {
    checkAdminStatus();
    fetchHeroImages();
  }, [user]);

  const fetchHeroImages = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_images' as any)
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      const heroImagesData = data as unknown as HeroImageData[] | null;

      setHeroImages(heroImagesData?.map(img => ({
        url: img.image_url,
        title: img.title || undefined,
        subtitle: img.subtitle || undefined,
        alt: img.alt_text || undefined
      })) || []);
    } catch (error) {
      console.error('Error fetching hero images:', error);
    }
  };

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      // Check user role directly from the user_roles table
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 px-6">
          <div className="container mx-auto text-center py-20">
            <h1 className="text-4xl font-orbitron font-bold text-foreground mb-4">
              Access Denied
            </h1>
            <p className="text-muted-foreground mb-8">
              You don't have permission to access the admin dashboard.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-orbitron font-bold text-gradient-gold mb-2">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage your store products, orders, and settings
              </p>
            </div>
            <Button
              onClick={() => window.location.href = '/admin/drops'}
              className="bg-mtrix-charcoal text-neon-cyan border border-neon-cyan/20 hover:bg-mtrix-charcoal/80 hover:shadow-[0_0_15px_rgba(0,255,209,0.3)] transition-all"
            >
              <Zap className="w-4 h-4 mr-2" />
              Open Drop Admin
            </Button>
          </div>

          <Tabs defaultValue="products" className="space-y-6">
            <TabsList className="grid w-full grid-cols-10 bg-mtrix-dark overflow-x-auto scrollbar-hide">
              <TabsTrigger value="products" className="flex items-center space-x-2">
                <Package className="w-4 h-4" />
                <span>Products</span>
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Inventory</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4" />
                <span>Content</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4" />
                <span>Orders</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Payments</span>
              </TabsTrigger>
              <TabsTrigger value="promotions" className="flex items-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>Coupons</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Users</span>
              </TabsTrigger>
              <TabsTrigger value="support" className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4" />
                <span>Support</span>
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>Reviews</span>
              </TabsTrigger>
              <TabsTrigger value="designs" className="flex items-center space-x-2">
                <Palette className="w-4 h-4" />
                <span>Designs</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </TabsTrigger>
              <TabsTrigger value="drops" className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Drops</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center space-x-2">
                <Instagram className="w-4 h-4" />
                <span>Social</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              <ProductManager />
            </TabsContent>

            <TabsContent value="inventory">
              <LowStockAlerts />
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <HeroImageManager
                images={heroImages}
                onChange={async (newImages) => {
                  setHeroImages(newImages);
                  await fetchHeroImages();
                }}
              />
              <PromotionStripManager />
              <CategoryManager />
              <BundleManager />
            </TabsContent>

            <TabsContent value="orders">
              <OrderManager />
            </TabsContent>

            <TabsContent value="payments">
              <PaymentManager />
            </TabsContent>

            <TabsContent value="promotions">
              <CouponManager />
            </TabsContent>

            <TabsContent value="users">
              <UserManager />
            </TabsContent>

            <TabsContent value="support" className="space-y-6">
              <SupportManager />
              <SocialMediaManager />
            </TabsContent>

            <TabsContent value="reviews">
              <ReviewManager />
            </TabsContent>

            <TabsContent value="designs">
              <DesignManager />
            </TabsContent>

            <TabsContent value="settings">
              <SiteSettingsManager />
            </TabsContent>

            <TabsContent value="drops">
              <DropManager />
            </TabsContent>

            <TabsContent value="social">
              <SocialContentManager />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;