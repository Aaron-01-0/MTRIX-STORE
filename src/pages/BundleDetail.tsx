import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingCart, Check, Plus, X } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OptimizedImage } from '@/components/OptimizedImage';

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
  allowed_category_id: string | null; // Added field
  product?: {
    name: string;
    base_price: number;
    product_images: { image_url: string }[];
  };
  variant?: {
    color: string;
    size: string;
    stock_quantity: number;
  };
}

interface ProductSelection {
  id: string;
  name: string;
  base_price: number;
  product_images: { image_url: string }[];
  variants: {
    id: string;
    color: string;
    size: string;
    stock_quantity: number;
  }[];
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

  // Custom Bundle State
  const [selectedItems, setSelectedItems] = useState<Record<string, { product: ProductSelection, variantId?: string }>>({});
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [slotProducts, setSlotProducts] = useState<ProductSelection[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

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
          product:products(name, base_price, product_images(image_url)),
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

  const fetchSlotProducts = async (categoryId: string) => {
    setLoadingProducts(true);
    try {
      // Fetch products in category with variants
      const { data, error } = await supabase
        .from('products')
        .select(`
                id, name, base_price,
                product_images(image_url),
                variants:product_variants(id, color, size, stock_quantity)
            `)
        .eq('category_id', categoryId)
        .eq('status', 'published')
        .eq('is_active', true);

      if (error) throw error;
      setSlotProducts(data as any || []);
    } catch (error) {
      console.error("Error fetching slot products:", error);
      toast({
        title: "Error",
        description: "Failed to load products for this slot",
        variant: "destructive"
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleOpenSlot = (slotId: string, categoryId: string | null) => {
    if (!categoryId) {
      toast({ title: "Configuration Error", description: "This slot has no category assigned.", variant: "destructive" });
      return;
    }
    setActiveSlot(slotId);
    fetchSlotProducts(categoryId);
  };

  const handleSelectProduct = (product: ProductSelection, variantId?: string) => {
    if (!activeSlot) return;

    setSelectedItems(prev => ({
      ...prev,
      [activeSlot]: { product, variantId }
    }));
    setActiveSlot(null);
  };

  const handleAddToCart = async () => {
    if (!bundle) return;
    setAddingToCart(true);

    try {
      let bundleItemsPayload = [];

      if (bundle.type === 'custom') {
        // Validate all slots filled
        const missingSlots = items.filter(item => !selectedItems[item.id]);
        if (missingSlots.length > 0) {
          toast({
            title: "Incomplete Bundle",
            description: `Please select items for: ${missingSlots.map(i => i.slot_name || 'Item').join(', ')}`,
            variant: "destructive"
          });
          setAddingToCart(false);
          return;
        }

        bundleItemsPayload = items.map(item => {
          const selection = selectedItems[item.id];
          return {
            product_id: selection.product.id,
            variant_id: selection.variantId,
            quantity: item.quantity
          };
        });

      } else {
        // Fixed bundle logic
        bundleItemsPayload = items
          .filter(item => item.product_id)
          .map(item => ({
            product_id: item.product_id!,
            variant_id: item.variant_id || undefined,
            quantity: item.quantity
          }));
      }

      if (bundleItemsPayload.length === 0) {
        toast({
          title: "Error",
          description: "No items to add",
          variant: "destructive"
        });
        setAddingToCart(false);
        return;
      }

      await addBundleToCart(bundle.id, bundleItemsPayload);
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
                <OptimizedImage
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

            {/* Items List */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold border-b border-white/10 pb-2">
                {bundle.type === 'custom' ? 'Build Your Bundle' : 'Included Items'}
              </h3>

              <div className="space-y-3">
                {items.map((item) => {
                  const selection = selectedItems[item.id];
                  const isCustom = bundle.type === 'custom';

                  return (
                    <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
                      {/* Image */}
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-black flex-shrink-0">
                        {isCustom ? (
                          selection ? (
                            <OptimizedImage src={selection.product.product_images?.[0]?.image_url} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/10 text-white/20">
                              <Plus className="w-6 h-6" />
                            </div>
                          )
                        ) : (
                          item.product?.product_images?.[0]?.image_url && (
                            <OptimizedImage src={item.product.product_images[0].image_url} className="w-full h-full object-cover" />
                          )
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-grow">
                        {isCustom ? (
                          selection ? (
                            <>
                              <p className="font-bold">{selection.product.name}</p>
                              {selection.variantId && (
                                <p className="text-sm text-muted-foreground">
                                  Variant Selected
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-muted-foreground italic">Select {item.slot_name || 'Item'}</p>
                          )
                        ) : (
                          <>
                            <p className="font-bold">{item.product?.name}</p>
                            {item.variant && (
                              <p className="text-sm text-muted-foreground">
                                {item.variant.color} / {item.variant.size}
                              </p>
                            )}
                          </>
                        )}
                        <p className="text-xs text-primary mt-1">x{item.quantity}</p>
                      </div>

                      {/* Action (Custom Only) */}
                      {isCustom && (
                        <Dialog open={activeSlot === item.id} onOpenChange={(open) => !open && setActiveSlot(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant={selection ? "outline" : "default"}
                              size="sm"
                              onClick={() => handleOpenSlot(item.id, item.allowed_category_id)}
                            >
                              {selection ? 'Change' : 'Select'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Select {item.slot_name || 'Product'}</DialogTitle>
                            </DialogHeader>

                            {loadingProducts ? (
                              <div className="flex justify-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                                {slotProducts.map(product => (
                                  <div key={product.id} className="bg-black border border-white/10 rounded-lg overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
                                    onClick={() => {
                                      // If no variants, select immediately
                                      if (!product.variants || product.variants.length === 0) {
                                        handleSelectProduct(product);
                                      }
                                    }}
                                  >
                                    <div className="aspect-square bg-white/5">
                                      {product.product_images?.[0]?.image_url && (
                                        <OptimizedImage src={product.product_images[0].image_url} className="w-full h-full object-cover" />
                                      )}
                                    </div>
                                    <div className="p-3">
                                      <h4 className="font-bold text-sm truncate">{product.name}</h4>
                                      <p className="text-xs text-muted-foreground mt-1">₹{product.base_price}</p>

                                      {/* Variant Selection if needed */}
                                      {product.variants && product.variants.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                          {product.variants.map(v => (
                                            <Button
                                              key={v.id}
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 text-[10px] px-2 bg-white/10 hover:bg-primary hover:text-black"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectProduct(product, v.id);
                                              }}
                                              disabled={v.stock_quantity < 1}
                                            >
                                              {v.size}
                                            </Button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {slotProducts.length === 0 && (
                                  <div className="col-span-full text-center py-10 text-muted-foreground">
                                    No products found in this category.
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

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
