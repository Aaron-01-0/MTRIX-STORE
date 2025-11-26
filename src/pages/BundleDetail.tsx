import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowLeft, Package, Check, ShieldCheck, Truck } from 'lucide-react';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import BundleImageCollage from '@/components/bundles/BundleImageCollage';

interface BundleItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    base_price: number;
    image_url?: string;
  };
}

interface Bundle {
  id: string;
  name: string;
  description?: string;
  bundle_price: number;
  image_url?: string;
  items: BundleItem[];
}

const BundleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBundle();
    }
  }, [id]);

  const fetchBundle = async () => {
    try {
      const { data: bundleData, error: bundleError } = await supabase
        .from('bundles')
        .select(`
          *,
          items:bundle_items (
            id,
            quantity,
            product:products (
              id,
              name,
              base_price,
              product_images (
                image_url,
                is_main
              )
            )
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (bundleError) throw bundleError;

      // Transform data to include correct image URL
      const itemsWithImages = bundleData.items.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          base_price: item.product.base_price,
          image_url: item.product.product_images?.find((img: any) => img.is_main)?.image_url
            || item.product.product_images?.[0]?.image_url
        }
      }));

      setBundle({
        ...bundleData,
        items: itemsWithImages
      });
    } catch (error) {
      console.error('Error fetching bundle:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bundle details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!bundle) return;

    await addToCart(bundle.id, 1, undefined, {
      isBundle: true,
      bundlePrice: bundle.bundle_price,
      bundleName: bundle.name
    });

    toast({
      title: 'Success',
      description: 'Bundle added to cart'
    });
  };

  const totalValue = bundle?.items.reduce(
    (sum, item) => sum + (item.product.base_price * item.quantity),
    0
  ) || 0;

  const savings = totalValue - (bundle?.bundle_price || 0);

  // Get product images for collage
  const productImages = bundle?.items.map(item => item.product.image_url || '').filter(Boolean) || [];
  const showCollage = productImages.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-mtrix-black">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-mtrix-black">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 pt-24 text-center">
          <h1 className="text-2xl text-white">Bundle not found</h1>
          <Button onClick={() => navigate('/bundles')} className="mt-4">Back to Bundles</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mtrix-black text-white">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/bundles')}
            className="mb-8 text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bundles
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column - Image/Collage */}
            <div className="space-y-6">
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-mtrix-gray bg-mtrix-dark group">
                {showCollage ? (
                  <BundleImageCollage images={productImages} name={bundle.name} />
                ) : (
                  <ImageWithFallback
                    src={bundle.image_url}
                    alt={bundle.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    fallbackClassName="w-full h-full bg-mtrix-dark"
                  />
                )}

                {/* Gradient Overlay only if not collage, or subtle if collage */}
                {!showCollage && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                )}

                {savings > 0 && (
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-4 py-1 rounded-full font-bold font-orbitron animate-pulse z-10 shadow-lg">
                    SAVE ₹{savings}
                  </div>
                )}
              </div>

              {/* Value Props */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-mtrix-dark border border-mtrix-gray text-center">
                  <ShieldCheck className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Official Warranty</p>
                </div>
                <div className="p-4 rounded-xl bg-mtrix-dark border border-mtrix-gray text-center">
                  <Truck className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Free Shipping</p>
                </div>
                <div className="p-4 rounded-xl bg-mtrix-dark border border-mtrix-gray text-center">
                  <Package className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Secure Packaging</p>
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-gradient-gold mb-4">
                  {bundle.name}
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {bundle.description}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-mtrix-dark/50 border border-mtrix-gray backdrop-blur-sm">
                <div className="flex items-end gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Bundle Price</p>
                    <p className="text-5xl font-bold text-primary">₹{bundle.bundle_price}</p>
                  </div>
                  {savings > 0 && (
                    <div className="mb-2">
                      <p className="text-lg text-muted-foreground line-through">₹{totalValue}</p>
                      <p className="text-sm text-green-500 font-semibold">
                        You save {Math.round((savings / totalValue) * 100)}%
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleAddToCart}
                  size="lg"
                  className="w-full h-14 text-lg bg-gradient-gold text-mtrix-black hover:shadow-gold hover:scale-[1.02] transition-all duration-300 font-bold"
                >
                  <ShoppingCart className="w-6 h-6 mr-2" />
                  Add Bundle to Cart
                </Button>
              </div>

              {/* What's Inside */}
              <div>
                <h3 className="text-xl font-orbitron font-bold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  What's Inside
                </h3>
                <div className="space-y-4">
                  {bundle.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-mtrix-dark border border-mtrix-gray hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/product/${item.product.id}`)}
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/20 shrink-0">
                        <ImageWithFallback
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          fallbackClassName="w-full h-full bg-mtrix-dark"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white group-hover:text-primary transition-colors">
                          {item.product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-primary font-bold">{item.quantity}x</span>
                          <span className="text-sm text-muted-foreground">₹{item.product.base_price} / unit</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Check className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BundleDetail;
