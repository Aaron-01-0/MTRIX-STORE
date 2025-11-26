import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Package } from 'lucide-react';
import BundleCard from '@/components/bundles/BundleCard';

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  bundle_price: number;
  display_order: number | null;
  items: {
    quantity: number;
    product: {
      name: string;
      base_price: number;
      image_url?: string;
    };
  }[];
}

const Bundles = () => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Bundles & Packs | MTRIX';

    const loadBundles = async () => {
      try {
        // Optimized query to fetch bundles and their items with images
        const { data, error } = await supabase
          .from('bundles')
          .select(`
            *,
            items:bundle_items (
              quantity,
              product:products (
                name,
                base_price,
                product_images (
                  image_url,
                  is_main
                )
              )
            )
          `)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;

        // Transform data to match Bundle interface
        const formattedBundles = data.map((bundle: any) => ({
          ...bundle,
          items: bundle.items.map((item: any) => ({
            quantity: item.quantity,
            product: {
              name: item.product?.name || 'Unknown Product',
              base_price: item.product?.base_price || 0,
              // Get the main image, or the first image if no main image is set
              image_url: item.product?.product_images?.find((img: any) => img.is_main)?.image_url
                || item.product?.product_images?.[0]?.image_url
            }
          }))
        }));

        setBundles(formattedBundles);
      } catch (e) {
        console.error('Failed to load bundles', e);
      } finally {
        setLoading(false);
      }
    };

    loadBundles();
  }, []);

  return (
    <div className="min-h-screen bg-mtrix-black text-white">
      <Navbar />

      <main className="pt-24 pb-20">
        {/* Hero Section */}
        <section className="relative py-20 px-6 overflow-hidden mb-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-mtrix-black to-mtrix-black" />
          <div className="container mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-up">
              <Package className="w-4 h-4" />
              <span>VALUE PACKS</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-orbitron font-bold mb-6 animate-fade-up delay-100">
              BUNDLES <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">& PACKS</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-up delay-200">
              Curated combinations for the ultimate setup. Save more when you buy together.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-[500px] bg-mtrix-dark animate-pulse rounded-xl border border-mtrix-gray" />
              ))}
            </div>
          ) : bundles.length === 0 ? (
            <div className="text-center py-20 bg-mtrix-dark/50 rounded-2xl border border-mtrix-gray border-dashed">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-orbitron font-bold mb-2">No bundles available</h3>
              <p className="text-muted-foreground">Check back later for new drops!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {bundles.map((bundle) => (
                <BundleCard key={bundle.id} bundle={bundle} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Bundles;
