import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Tag, Truck, ArrowRight, Gift, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, CartItem } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { isPast, isValid, parseISO, endOfDay } from 'date-fns';
import TrendingSlider from '@/components/home/TrendingSlider';

const Cart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { cartItems, loading, updateQuantity: updateCartQuantity, removeFromCart } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  // Group items by bundle_id
  const groupedItems = cartItems.reduce((acc, item) => {
    if (item.bundle_id) {
      if (!acc.bundles[item.bundle_id]) {
        acc.bundles[item.bundle_id] = {
          bundle: item.bundle!,
          items: []
        };
      }
      acc.bundles[item.bundle_id].items.push(item);
    } else {
      acc.standalone.push(item);
    }
    return acc;
  }, {
    bundles: {} as Record<string, { bundle: NonNullable<CartItem['bundle']>, items: CartItem[] }>,
    standalone: [] as CartItem[]
  });

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateCartQuantity(id, newQuantity);
  };

  const removeItem = (id: string) => {
    removeFromCart(id);
  };

  const removeBundle = (bundleId: string) => {
    // Remove all items in this bundle
    const items = groupedItems.bundles[bundleId].items;
    items.forEach(item => removeFromCart(item.id));
  };

  const applyPromoCode = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast({
          title: "Invalid Promo Code",
          description: "Please check your promo code and try again.",
          variant: "destructive"
        });
        return;
      }

      if (data.valid_until) {
        const expiryDate = endOfDay(new Date(data.valid_until));
        if (!isValid(expiryDate) || isPast(expiryDate)) {
          toast({
            title: "Expired",
            description: "This promo code has expired.",
            variant: "destructive"
          });
          return;
        }
      }

      if (subtotal < data.min_order_value) {
        toast({
          title: "Minimum Order Not Met",
          description: `Minimum order value is ₹${data.min_order_value}`,
          variant: "destructive"
        });
        return;
      }

      if (data.usage_limit && data.used_count >= data.usage_limit) {
        toast({
          title: "Coupon Limit Reached",
          description: "This promo code has reached its usage limit.",
          variant: "destructive"
        });
        return;
      }

      setAppliedPromo(data.code);
      toast({
        title: "Promo Code Applied!",
        description: `${data.discount_type === 'percentage' ? data.discount_value + '%' : '₹' + data.discount_value} discount applied.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply promo code",
        variant: "destructive"
      });
    }
    setPromoCode('');
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    toast({
      title: "Promo Code Removed",
      description: "Discount has been removed from your order.",
    });
  };

  const [shippingSettings, setShippingSettings] = useState({ cost: 50, threshold: 499 });

  useEffect(() => {
    const fetchShippingSettings = async () => {
      const { data } = await supabase
        .from('support_settings')
        .select('*')
        .single();

      if (data) {
        const settings = data as any;
        setShippingSettings({
          cost: Number(settings.shipping_cost) || 50,
          threshold: Number(settings.free_shipping_threshold) || 499
        });
      }
    };
    fetchShippingSettings();
  }, []);

  const calculateBundlePrice = (bundle: NonNullable<CartItem['bundle']>, items: CartItem[]) => {
    const itemsTotal = items.reduce((sum, item) => {
      const price = item.product.discount_price || item.product.base_price;
      return sum + (price * item.quantity);
    }, 0);

    if (bundle.price_type === 'fixed') {
      return itemsTotal; // Fallback to item sum for now
    } else if (bundle.price_type === 'percentage_discount') {
      return itemsTotal * (1 - bundle.price_value / 100);
    } else if (bundle.price_type === 'fixed_discount') {
      return Math.max(0, itemsTotal - bundle.price_value);
    }
    return itemsTotal;
  };

  const subtotal =
    groupedItems.standalone.reduce((sum, item) => {
      const price = item.product.discount_price || item.product.base_price;
      return sum + (price * item.quantity);
    }, 0) +
    Object.values(groupedItems.bundles).reduce((sum, group) => {
      return sum + calculateBundlePrice(group.bundle, group.items);
    }, 0);

  const shipping = subtotal >= shippingSettings.threshold ? 0 : shippingSettings.cost;

  const [couponData, setCouponData] = useState<any>(null);

  useEffect(() => {
    if (appliedPromo) {
      supabase
        .from('coupons')
        .select('*')
        .eq('code', appliedPromo)
        .single()
        .then(({ data }) => setCouponData(data));
    } else {
      setCouponData(null);
    }
  }, [appliedPromo]);

  const calculateDiscount = () => {
    if (!couponData) return 0;
    if (couponData.discount_type === 'percentage') {
      const discount = subtotal * (couponData.discount_value / 100);
      return couponData.max_discount_amount
        ? Math.min(discount, couponData.max_discount_amount)
        : discount;
    }
    return couponData.discount_value;
  };

  const promoDiscount = calculateDiscount();
  const total = subtotal + shipping - promoDiscount;

  const hasOutOfStockItems = cartItems.some(item => item.product.stock_quantity < 1);
  const freeShippingProgress = Math.min((subtotal / shippingSettings.threshold) * 100, 100);
  const amountToFreeShipping = Math.max(shippingSettings.threshold - subtotal, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
          <p className="mt-4 text-muted-foreground font-orbitron">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background selection:bg-gold/30">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6 text-center py-16">
            <ShoppingBag className="w-16 h-16 text-gold mx-auto mb-6 opacity-50" />
            <h1 className="text-4xl font-orbitron font-bold text-gradient-gold mb-4">Your cart is empty</h1>
            <Link to="/catalog">
              <Button className="bg-gradient-gold text-mtrix-black font-bold">Start Shopping</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-gold/30">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-orbitron font-bold">Shopping Cart</h1>
            <Link to="/catalog">
              <Button variant="ghost" className="text-primary hover:text-gold">
                <ArrowLeft className="w-4 h-4 mr-2" /> Continue Shopping
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Free Shipping Progress */}
              <Card className="bg-mtrix-dark/50 border-mtrix-gray">
                <CardContent className="p-6">
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gold" />
                      {amountToFreeShipping > 0 ? `Add ₹${amountToFreeShipping} for free shipping` : 'Free Shipping Unlocked!'}
                    </span>
                    <span>{Math.round(freeShippingProgress)}%</span>
                  </div>
                  <Progress value={freeShippingProgress} className="h-2 bg-mtrix-gray" />
                </CardContent>
              </Card>

              {/* Bundles */}
              {Object.values(groupedItems.bundles).map(({ bundle, items }) => (
                <Card key={bundle.id} className="bg-mtrix-dark/50 border-gold/30">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-gold" />
                          <h3 className="text-xl font-bold text-gold">{bundle.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">Bundle Deal</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeBundle(bundle.id)} className="text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-3 pl-4 border-l-2 border-white/10">
                      {items.map(item => (
                        <div key={item.id} className="flex gap-4">
                          <img src={item.product.image_url} className="w-12 h-12 rounded bg-black object-cover" />
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Bundle Price</p>
                        <p className="text-xl font-bold text-gold">₹{Math.round(calculateBundlePrice(bundle, items))}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Standalone Items */}
              {groupedItems.standalone.map((item) => (
                <Card key={item.id} className={`bg-mtrix-dark/50 border-mtrix-gray ${item.product.stock_quantity < 1 ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4 sm:p-6 flex gap-4">
                    <div className="w-24 h-24 bg-cover bg-center rounded-lg border border-mtrix-gray flex-shrink-0" style={{ backgroundImage: `url(${item.product.image_url})` }} />
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between">
                        <h3 className="font-semibold">{item.product.name}</h3>
                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center border border-mtrix-gray rounded-lg bg-mtrix-black/50">
                          <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-8 w-8">
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="px-3 text-sm">{item.quantity}</span>
                          <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-8 w-8">
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-gold">₹{item.product.discount_price || item.product.base_price}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <Card className="bg-mtrix-dark/50 border-mtrix-gray">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gold" /> Promo Code
                    </h3>
                    {appliedPromo ? (
                      <div className="flex justify-between items-center p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <span className="text-green-400 font-semibold flex items-center gap-2"><Gift className="w-4 h-4" /> {appliedPromo}</span>
                        <Button variant="ghost" size="sm" onClick={removePromoCode} className="text-green-400 h-auto p-1"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input placeholder="Enter code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className="bg-mtrix-black border-mtrix-gray" />
                        <Button onClick={applyPromoCode} variant="outline" className="border-gold text-gold hover:bg-gold hover:text-mtrix-black">Apply</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-mtrix-dark/50 border-mtrix-gray shadow-lg">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-lg font-orbitron font-bold">Order Summary</h3>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>₹{Math.round(subtotal)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shipping</span><span className={shipping === 0 ? "text-green-400" : ""}>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
                    {promoDiscount > 0 && <div className="flex justify-between text-sm text-green-400"><span>Discount</span><span>-₹{Math.round(promoDiscount)}</span></div>}
                    <Separator className="bg-mtrix-gray" />
                    <div className="flex justify-between items-end"><span className="text-base font-semibold">Total</span><span className="text-2xl font-bold text-gold">₹{Math.round(total)}</span></div>
                    <Button className="w-full mt-4 bg-gradient-gold text-mtrix-black font-bold py-6" disabled={hasOutOfStockItems || !user} onClick={() => navigate('/checkout', { state: { couponCode: appliedPromo } })}>
                      {!user ? 'Sign in to Checkout' : hasOutOfStockItems ? 'Remove Out of Stock Items' : 'Proceed to Checkout'} <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;