import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Tag, Truck, ArrowRight, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
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

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateCartQuantity(id, newQuantity);
  };

  const removeItem = (id: string) => {
    removeFromCart(id);
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

      // Check validity
      if (data.valid_until) {
        const expiryDate = endOfDay(new Date(data.valid_until));

        if (!isValid(expiryDate)) {
          console.error('Invalid expiry date format:', data.valid_until);
          toast({
            title: "Error",
            description: "Invalid coupon configuration.",
            variant: "destructive"
          });
          return;
        }

        if (isPast(expiryDate)) {
          toast({
            title: "Expired",
            description: "This promo code has expired.",
            variant: "destructive"
          });
          return;
        }
      }

      // Check minimum order value
      if (subtotal < data.min_order_value) {
        toast({
          title: "Minimum Order Not Met",
          description: `Minimum order value is ₹${data.min_order_value}`,
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

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product.discount_price || item.product.base_price;
    return sum + (price * item.quantity);
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

  // Calculate progress to free shipping
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
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center space-y-8 py-16 animate-in fade-in zoom-in duration-500">
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 bg-gold/20 rounded-full animate-ping opacity-20"></div>
                <div className="relative w-full h-full bg-mtrix-dark rounded-full flex items-center justify-center border-2 border-mtrix-gray shadow-[0_0_30px_-10px_rgba(255,215,0,0.3)]">
                  <ShoppingBag className="w-12 h-12 text-gold" />
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-orbitron font-bold text-gradient-gold">
                  Your cart is empty
                </h1>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  Looks like you haven't added anything to your cart yet.
                  Explore our premium collection and find something you love.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/catalog">
                  <Button className="w-full sm:w-auto bg-gradient-gold text-mtrix-black hover:shadow-gold transition-all duration-300 px-8 py-6 text-lg font-bold">
                    Start Shopping <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/wishlist">
                  <Button variant="outline" className="w-full sm:w-auto border-mtrix-gray hover:bg-mtrix-gray/20 px-8 py-6 text-lg">
                    View Wishlist
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-mtrix-gray/30">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                    <Truck className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">Free Shipping</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <div className="w-5 h-5 border-2 border-current rounded-full flex items-center justify-center text-[10px] font-bold">₹</div>
                  </div>
                  <span className="text-sm font-medium">Secure Payment</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <Gift className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">Authentic Products</span>
                </div>
              </div>
            </div>

            {/* Trending Section */}
            <div className="mt-8">
              <TrendingSlider />
            </div>
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
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-orbitron font-bold text-foreground mb-2">
                Shopping Cart
              </h1>
              <p className="text-muted-foreground">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
            <Link to="/catalog">
              <Button variant="ghost" className="text-primary hover:text-gold hover:bg-gold/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items Column */}
            <div className="lg:col-span-2 space-y-6">

              {/* Free Shipping Progress */}
              <Card className="bg-mtrix-dark/50 border-mtrix-gray overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gold" />
                      {amountToFreeShipping > 0
                        ? `Add ₹${amountToFreeShipping} more for free shipping`
                        : 'You have unlocked Free Shipping!'}
                    </span>
                    <span className="text-sm text-muted-foreground">{Math.round(freeShippingProgress)}%</span>
                  </div>
                  <Progress value={freeShippingProgress} className="h-2 bg-mtrix-gray" />
                </CardContent>
              </Card>

              {/* Items List */}
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <Card
                    key={item.id}
                    className={`bg-mtrix-dark/50 border-mtrix-gray backdrop-blur-sm transition-all hover:border-gold/30 ${item.product.stock_quantity < 1 ? 'opacity-60' : ''}`}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex gap-4 sm:gap-6">
                        <div className="relative group">
                          <div
                            className="w-24 h-24 sm:w-32 sm:h-32 bg-cover bg-center rounded-lg flex-shrink-0 border border-mtrix-gray"
                            style={{ backgroundImage: `url(${item.product.image_url || '/placeholder.svg'})` }}
                          />
                          {item.product.stock_quantity < 1 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                              <span className="text-xs font-bold text-red-500 bg-black/80 px-2 py-1 rounded">OUT OF STOCK</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-lg text-foreground line-clamp-2">
                                {item.product.name}
                              </h3>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(item.id)}
                                className="text-muted-foreground hover:text-red-400 -mr-2 -mt-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Variant info if available */}
                            {item.variant_id && (
                              <p className="text-sm text-muted-foreground mb-2">Variant: Default</p>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center border border-mtrix-gray rounded-lg bg-mtrix-black/50">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="rounded-none h-8 w-8 hover:bg-mtrix-gray/50"
                                disabled={item.product.stock_quantity < 1}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="px-3 py-1 text-sm font-semibold min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="rounded-none h-8 w-8 hover:bg-mtrix-gray/50"
                                disabled={item.product.stock_quantity < 1}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>

                            <div className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <span className="text-xl font-bold text-gold">
                                  ₹{item.product.discount_price || item.product.base_price}
                                </span>
                                {item.product.discount_price && (
                                  <span className="text-sm text-muted-foreground line-through">
                                    ₹{item.product.base_price}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Total: ₹{(item.product.discount_price || item.product.base_price) * item.quantity}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Order Summary Column */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">

                {/* Promo Code */}
                <Card className="bg-mtrix-dark/50 border-mtrix-gray backdrop-blur-sm">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gold" /> Promo Code
                    </h3>

                    {appliedPromo ? (
                      <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-center">
                          <Gift className="w-4 h-4 text-green-400 mr-2" />
                          <span className="text-green-400 font-semibold">{appliedPromo}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removePromoCode}
                          className="text-green-400 hover:text-green-300 h-auto p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="bg-mtrix-black border-mtrix-gray focus:border-gold"
                        />
                        <Button
                          onClick={applyPromoCode}
                          disabled={!promoCode}
                          variant="outline"
                          className="border-gold text-gold hover:bg-gold hover:text-mtrix-black"
                        >
                          Apply
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order Summary */}
                <Card className="bg-mtrix-dark/50 border-mtrix-gray backdrop-blur-sm shadow-lg shadow-black/20">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-orbitron font-bold text-foreground mb-6">
                      Order Summary
                    </h3>

                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="text-foreground font-medium">₹{subtotal}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className={shipping === 0 ? "text-green-400 font-medium" : "text-foreground font-medium"}>
                          {shipping === 0 ? 'Free' : `₹${shipping}`}
                        </span>
                      </div>

                      {promoDiscount > 0 && (
                        <div className="flex justify-between text-sm text-green-400">
                          <span>Discount</span>
                          <span>-₹{Math.round(promoDiscount)}</span>
                        </div>
                      )}

                      <Separator className="bg-mtrix-gray" />

                      <div className="flex justify-between items-end">
                        <span className="text-base font-semibold text-foreground">Total</span>
                        <span className="text-2xl font-bold text-gold">₹{Math.round(total)}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full mt-8 bg-gradient-gold text-mtrix-black hover:shadow-gold transition-all duration-300 py-6 text-lg font-bold"
                      disabled={hasOutOfStockItems || !user}
                      onClick={() => navigate('/checkout', { state: { couponCode: appliedPromo } })}
                    >
                      {!user ? 'Sign in to Checkout' : hasOutOfStockItems ? 'Remove Out of Stock Items' : 'Proceed to Checkout'}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>

                    {hasOutOfStockItems && (
                      <p className="text-xs text-red-400 text-center mt-3">
                        Some items are out of stock. Please remove them to proceed.
                      </p>
                    )}

                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Secure Checkout
                      </div>
                      <span className="text-mtrix-gray">•</span>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Money-back Guarantee
                      </div>
                    </div>
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