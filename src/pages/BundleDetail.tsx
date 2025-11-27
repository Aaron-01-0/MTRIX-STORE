import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingCart, Check } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

// Types
interface Bundle {
  id: string;
  name: string;
  description: string | null;
  type: 'fixed' | 'custom' | 'quantity';
  price_type: 'fixed' | 'percentage_discount' | 'fixed_discount';
  price_value: number;
  cover_image: string | null;
}

interface BundleItem {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  quantity: number;
  slot_name: string | null;
  product?: {
    name: string;
    price: number;
    images: string[];
  };
  variant?: {
    color: string;
    size: string;
    stock_quantity: number;
  };
}

const BundleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart, addBundleToCart } = useCart();

  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [items, setItems] = useState<BundleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id) fetchBundleDetails();
  }, [id]);

  const fetchBundleDetails = async () => {
    try {
      // Fetch Bundle
      const { data: bundleData, error: bundleError } = await supabase
        .from('bundles')
        .select('*')
        .eq('id', id)
        .single();

      if (bundleError) throw bundleError;
      setBundle(bundleData as any);

      // Fetch Items with Product/Variant details
      const { data: itemsData, error: itemsError } = await supabase
        .from('bundle_items')
        .select(`
          *,
          product:products(name, price, images),
          variant:product_variants(color, size, stock_quantity)
        `)
        .eq('bundle_id', id);

      if (itemsError) throw itemsError;
      setItems(itemsData as any);

    } catch (error) {
      console.error('Error fetching bundle details:', error);
      toast({
        title: "Error",
        description: "Failed to load bundle details",
        variant: "destructive"
      });
      navigate('/bundles');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!bundle) return;
    setAddingToCart(true);

    try {
      const bundleItems = items.map(item => ({
        product_id: item.product_id!,
        variant_id: item.variant_id || undefined,
        quantity: item.quantity
      }));

      await addBundleToCart(bundle.id, bundleItems);
      navigate('/cart');
    } catch (error) {
      // Error handled in hook
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!bundle) return null;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-primary">
      <Navbar />

      <main className="pt-24 pb-20 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Image */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden border border-white/10 bg-zinc-900">
              {bundle.cover_image && (
                <img
                  src={bundle.cover_image}
                  alt={bundle.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

          {/* Right: Details */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4">{bundle.name}</h1>
              <p className="text-gray-400 text-lg leading-relaxed">{bundle.description}</p>
            </div>

            {/* Items List (For Fixed Bundle) */}
            {bundle.type === 'fixed' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold border-b border-white/10 pb-2">Included Items</h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-black">
                        {item.product?.images?.[0] && (
                          <img src={item.product.images[0]} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold">{item.product?.name}</p>
                        {item.variant && (
                          <p className="text-sm text-muted-foreground">
                            {item.variant.color} / {item.variant.size}
                          </p>
                        )}
                        <p className="text-xs text-primary mt-1">x{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action */}
            <div className="pt-6 border-t border-white/10">
              <div className="flex items-end gap-4 mb-6">
                <div className="text-3xl font-bold text-primary">
                  {bundle.price_type === 'fixed' ? `₹${bundle.price_value}` : `${bundle.price_value}% OFF`}
                </div>
                {bundle.price_type !== 'fixed' && (
                  <div className="text-sm text-muted-foreground mb-1">
                    Bundle Savings
                  </div>
                )}
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-lg font-bold bg-primary text-black hover:bg-primary/90"
                onClick={handleAddToCart}
                disabled={addingToCart}
              >
                {addingToCart ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add Bundle to Cart
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BundleDetail;
