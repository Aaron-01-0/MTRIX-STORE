import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart, CartItem } from '@/hooks/useCart';
import { useSavedAddresses } from '@/hooks/useSavedAddresses';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { addressSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { MapPin, Plus, Edit2, Check, ShieldCheck, CreditCard, Truck, ChevronRight, Tag, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { cartItems, loading: cartLoading } = useCart();
  const { addresses, loading: addressesLoading } = useSavedAddresses();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [validatingPincode, setValidatingPincode] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [addressData, setAddressData] = useState({
    address_line_1: '',
    address_line_2: '',
    city: '',
    pincode: '',
    state: '',
    district: ''
  });

  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponData, setCouponData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPolicyAccepted, setIsPolicyAccepted] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (data) setIsAdmin(true);
    };
    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (location.state?.couponCode) {
      setCouponCode(location.state.couponCode);
      // Fetch coupon details for display
      supabase
        .from('coupons')
        .select('*')
        .eq('code', location.state.couponCode)
        .single()
        .then(({ data }) => setCouponData(data));
    }
  }, [location.state]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Don't redirect if cart is still loading
    if (!cartLoading && cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before checking out",
        variant: "destructive"
      });
      navigate('/cart');
      return;
    }

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [user, cartItems.length, cartLoading, navigate, toast]);

  // Load default address when addresses are fetched
  useEffect(() => {
    if (!addressesLoading && addresses.length > 0) {
      const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
      setAddressData({
        address_line_1: defaultAddress.address_line_1,
        address_line_2: defaultAddress.address_line_2 || '',
        city: defaultAddress.city,
        pincode: defaultAddress.pincode,
        state: defaultAddress.state || '',
        district: defaultAddress.district || ''
      });
    }
  }, [addresses, addressesLoading]);

  const handleAddressSelection = (addressId: string) => {
    setSelectedAddressId(addressId);
    if (addressId === 'new') {
      setAddressData({
        address_line_1: '',
        address_line_2: '',
        city: '',
        pincode: '',
        state: '',
        district: ''
      });
    } else {
      const selected = addresses.find(addr => addr.id === addressId);
      if (selected) {
        setAddressData({
          address_line_1: selected.address_line_1,
          address_line_2: selected.address_line_2 || '',
          city: selected.city,
          pincode: selected.pincode,
          state: selected.state || '',
          district: selected.district || ''
        });
      }
    }
  };

  const validatePincode = async (pincode: string) => {
    if (!/^[0-9]{6}$/.test(pincode)) return;

    setValidatingPincode(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-pincode', {
        body: { pincode }
      });

      if (error) throw error;

      if (data) {
        setAddressData(prev => ({
          ...prev,
          city: data.place_name || prev.city,
          state: data.state || prev.state,
          district: data.district || prev.district
        }));
        toast({
          title: "Pincode validated",
          description: `${data.place_name}, ${data.district}, ${data.state}`
        });
      }
    } catch (error) {
      logger.error('Pincode validation failed', error);
    } finally {
      setValidatingPincode(false);
    }
  };

  const handlePincodeChange = (value: string) => {
    setAddressData({ ...addressData, pincode: value });
    if (value.length === 6) {
      validatePincode(value);
    }
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

  // --- Bundle Logic Start ---

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

  const calculateBundlePrice = (bundle: NonNullable<CartItem['bundle']>, items: CartItem[]) => {
    const itemsTotal = items.reduce((sum, item) => {
      const price = item.product.discount_price || item.product.base_price;
      return sum + (price * item.quantity);
    }, 0);

    if (bundle.price_type === 'fixed') {
      return itemsTotal; // Fallback
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

  // --- Bundle Logic End ---

  const shippingCost = subtotal >= shippingSettings.threshold ? 0 : shippingSettings.cost;

  // Calculate discount for display
  let discountAmount = 0;
  if (couponData) {
    if (couponData.discount_type === 'percentage') {
      const discount = subtotal * (couponData.discount_value / 100);
      discountAmount = couponData.max_discount_amount
        ? Math.min(discount, couponData.max_discount_amount)
        : discount;
    } else {
      discountAmount = couponData.discount_value;
    }
  }

  const totalAmount = Math.max(0, subtotal + shippingCost - discountAmount);

  const handlePayment = async () => {
    // Validate policy acceptance
    if (!isPolicyAccepted) {
      toast({
        title: "Policy Acceptance Required",
        description: "Please read and accept the Return & Refund Policy to proceed.",
        variant: "destructive"
      });
      return;
    }

    // Validate address
    const validation = addressSchema.safeParse(addressData);

    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Call secure Edge Function to create order and Razorpay order
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: {
            shippingAddress: addressData,
            couponCode: couponCode // Pass coupon code
          }
        }
      );

      if (orderError) throw orderError;

      logger.debug('Order created', { orderId: orderData.orderId });

      const cancelOrder = async (orderId: string) => {
        try {
          await supabase.functions.invoke('cancel-order', {
            body: { orderId }
          });
        } catch (error) {
          console.error('Failed to cancel order:', error);
        }
      };

      // Initialize Razorpay with server-provided key
      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        name: 'MTRIX Store',
        description: `Order ${orderData.orderNumber}`,
        order_id: orderData.razorpayOrderId,
        handler: async function (response: any) {
          try {
            // Verify payment on server
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
              'verify-razorpay-payment',
              {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: orderData.orderId
                }
              }
            );

            if (verifyError) {
              logger.error('Payment verification error', verifyError);
              throw new Error(verifyError.message || 'Payment verification failed');
            }

            if (!verifyData?.success) {
              throw new Error(verifyData?.error || 'Payment verification failed');
            }

            logger.info('Payment verified successfully');

            toast({
              title: "Payment Successful!",
              description: `Order ${orderData.orderNumber} has been placed successfully.`
            });

            // Navigate to order detail page
            navigate(`/order/${orderData.orderId}`);
          } catch (error: any) {
            logger.error('Payment verification failed', error);
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Please contact support with your order details.",
              variant: "destructive"
            });
            setLoading(false);
          }
        },
        prefill: {
          email: user!.email
        },
        theme: {
          color: '#FFD700'
        },
        modal: {
          ondismiss: function () {
            logger.info('Payment modal dismissed by user');
            cancelOrder(orderData.orderId); // Cancel order on dismiss
            toast({
              title: "Payment Cancelled",
              description: "You cancelled the payment. The order has been cancelled.",
              variant: "destructive"
            });
            setLoading(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response: any) {
        logger.error('Payment failed', response.error);
        cancelOrder(orderData.orderId); // Cancel order on failure
        toast({
          title: "Payment Failed",
          description: response.error.description || "Payment was not successful. Please try again.",
          variant: "destructive"
        });
        setLoading(false);
      });
      paymentObject.open();
    } catch (error: any) {
      logger.error('Order creation failed', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create order. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-gold/30">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6">

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-12 max-w-2xl mx-auto">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gold text-mtrix-black flex items-center justify-center font-bold">1</div>
              <span className="ml-2 font-medium text-gold hidden sm:block">Cart</span>
            </div>
            <div className="w-16 h-1 bg-gold mx-4"></div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gold text-mtrix-black flex items-center justify-center font-bold shadow-[0_0_15px_rgba(255,215,0,0.5)]">2</div>
              <span className="ml-2 font-medium text-gold hidden sm:block">Checkout</span>
            </div>
            <div className="w-16 h-1 bg-mtrix-gray mx-4"></div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-mtrix-dark border border-mtrix-gray text-muted-foreground flex items-center justify-center font-bold">3</div>
              <span className="ml-2 font-medium text-muted-foreground hidden sm:block">Done</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Shipping & Address */}
            <div className="lg:col-span-2 space-y-8">

              {/* Shipping Address Section */}
              <Card className="bg-mtrix-dark/50 border-mtrix-gray backdrop-blur-sm">
                <CardHeader className="border-b border-mtrix-gray/50 pb-4">
                  <CardTitle className="text-xl font-orbitron font-bold text-foreground flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gold" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">

                  {/* Saved Addresses */}
                  {!addressesLoading && addresses.length > 0 && (
                    <div className="space-y-4">
                      <Label className="text-base">Select Delivery Address</Label>
                      <RadioGroup value={selectedAddressId} onValueChange={handleAddressSelection} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((address) => (
                          <div key={address.id} className={`relative flex items-start space-x-3 p-4 border rounded-xl transition-all duration-200 cursor-pointer ${selectedAddressId === address.id ? 'border-gold bg-gold/5 shadow-[0_0_15px_-5px_rgba(255,215,0,0.2)]' : 'border-mtrix-gray hover:border-gold/50'}`}>
                            <RadioGroupItem value={address.id} id={address.id} className="mt-1 border-gold text-gold" />
                            <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                              <div className="flex justify-between items-start mb-1">
                                <Badge variant="outline" className="border-gold/30 text-gold bg-gold/5 uppercase text-[10px] tracking-wider">
                                  {address.address_type}
                                </Badge>
                                {address.is_default && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Default
                                  </span>
                                )}
                              </div>
                              <div className="font-medium text-foreground mb-1">{address.address_line_1}</div>
                              <div className="text-sm text-muted-foreground line-clamp-2">
                                {address.address_line_2 && `${address.address_line_2}, `}
                                {address.city}, {address.state} - {address.pincode}
                              </div>
                            </Label>
                          </div>
                        ))}

                        {/* Add New Address Option */}
                        <div
                          className={`flex items-center justify-center p-4 border rounded-xl transition-all duration-200 cursor-pointer border-dashed ${selectedAddressId === 'new' ? 'border-gold bg-gold/5' : 'border-mtrix-gray hover:border-gold/50'}`}
                          onClick={() => handleAddressSelection('new')}
                        >
                          <div className="flex flex-col items-center gap-2 text-center">
                            <div className="w-10 h-10 rounded-full bg-mtrix-gray/20 flex items-center justify-center">
                              <Plus className="w-5 h-5 text-gold" />
                            </div>
                            <span className="font-medium text-sm">Add New Address</span>
                            <RadioGroupItem value="new" id="new" className="sr-only" />
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {/* Address Form */}
                  <div className={`space-y-4 pt-4 ${selectedAddressId !== 'new' && addresses.length > 0 ? 'hidden' : 'animate-in fade-in slide-in-from-top-4'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Edit2 className="w-4 h-4 text-gold" />
                      <h3 className="font-medium">Enter Address Details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Pincode *</Label>
                        <div className="relative">
                          <Input
                            value={addressData.pincode}
                            onChange={(e) => handlePincodeChange(e.target.value)}
                            placeholder="6-digit pincode"
                            className="bg-mtrix-black border-mtrix-gray focus:border-gold pl-10"
                            maxLength={6}
                          />
                          <MapPin className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                        </div>
                        {validatingPincode && (
                          <p className="text-xs text-gold animate-pulse">Validating pincode...</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>City *</Label>
                        <Input
                          value={addressData.city}
                          onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                          placeholder="City"
                          className="bg-mtrix-black border-mtrix-gray focus:border-gold"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Address Line 1 *</Label>
                      <Input
                        value={addressData.address_line_1}
                        onChange={(e) => setAddressData({ ...addressData, address_line_1: e.target.value })}
                        placeholder="House No., Building Name"
                        className="bg-mtrix-black border-mtrix-gray focus:border-gold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Address Line 2</Label>
                      <Input
                        value={addressData.address_line_2}
                        onChange={(e) => setAddressData({ ...addressData, address_line_2: e.target.value })}
                        placeholder="Road Name, Area, Colony"
                        className="bg-mtrix-black border-mtrix-gray focus:border-gold"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>District</Label>
                        <Input
                          value={addressData.district}
                          onChange={(e) => setAddressData({ ...addressData, district: e.target.value })}
                          placeholder="District"
                          className="bg-mtrix-black border-mtrix-gray focus:border-gold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Input
                          value={addressData.state}
                          onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                          placeholder="State"
                          className="bg-mtrix-black border-mtrix-gray focus:border-gold"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method Preview */}
              <Card className="bg-mtrix-dark/50 border-mtrix-gray backdrop-blur-sm opacity-80">
                <CardHeader>
                  <CardTitle className="text-xl font-orbitron font-bold text-foreground flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gold" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 p-4 border border-mtrix-gray rounded-xl bg-mtrix-black/30">
                    <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                      <img src="https://cdn.razorpay.com/static/assets/logo/payment.svg" alt="Razorpay" className="h-4" />
                    </div>
                    <div>
                      <p className="font-medium">Razorpay Secure</p>
                      <p className="text-xs text-muted-foreground">Cards, UPI, Netbanking, Wallets</p>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-green-500 ml-auto" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <Card className="bg-mtrix-dark/50 border-mtrix-gray backdrop-blur-sm shadow-xl shadow-black/20">
                  <CardHeader className="border-b border-mtrix-gray/50 pb-4">
                    <CardTitle className="text-xl font-orbitron font-bold text-foreground">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">

                    {/* Items List */}
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">

                      {/* Bundles */}
                      {Object.values(groupedItems.bundles).map(({ bundle, items }) => (
                        <div key={bundle.id} className="p-3 bg-white/5 rounded-lg border border-gold/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="w-4 h-4 text-gold" />
                            <span className="font-bold text-sm text-gold">{bundle.name}</span>
                          </div>
                          <div className="space-y-2 pl-2 border-l border-white/10">
                            {items.map(item => (
                              <div key={item.id} className="flex gap-2 text-xs text-muted-foreground">
                                <span>{item.quantity}x</span>
                                <span className="line-clamp-1">{item.product.name}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 text-right font-bold text-gold">
                            ₹{Math.round(calculateBundlePrice(bundle, items))}
                          </div>
                        </div>
                      ))}

                      {/* Standalone Items */}
                      {groupedItems.standalone.map(item => (
                        <div key={item.id} className="flex gap-3">
                          <div className="w-16 h-16 rounded-lg bg-mtrix-black border border-mtrix-gray overflow-hidden flex-shrink-0">
                            <img
                              src={item.product.image_url || '/placeholder.svg'}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-2">{item.product.name}</p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                              <span className="text-sm font-semibold text-gold">
                                ₹{(item.product.discount_price || item.product.base_price) * item.quantity}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="bg-mtrix-gray" />

                    {/* Cost Breakdown */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="text-foreground font-medium">₹{Math.round(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className={shippingCost === 0 ? "text-green-400 font-medium" : "text-foreground font-medium"}>
                          {shippingCost === 0 ? 'Free' : `₹${shippingCost}`}
                        </span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-400">
                          <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Discount ({couponCode})</span>
                          <span>-₹{Math.round(discountAmount)}</span>
                        </div>
                      )}
                    </div>

                    <Separator className="bg-mtrix-gray" />

                    <div className="flex justify-between items-end">
                      <span className="text-base font-semibold text-foreground">Total Amount</span>
                      <span className="text-2xl font-bold text-gold">₹{Math.round(totalAmount)}</span>
                    </div>

                    <div className="flex items-start space-x-2 py-4">
                      <Checkbox
                        id="policy"
                        checked={isPolicyAccepted}
                        onCheckedChange={(checked) => setIsPolicyAccepted(checked as boolean)}
                        className="border-mtrix-gold data-[state=checked]:bg-mtrix-gold data-[state=checked]:text-mtrix-black mt-1"
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="policy"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
                        >
                          I agree to the <a href="/returns" target="_blank" rel="noopener noreferrer" className="text-mtrix-gold font-bold underline underline-offset-4 hover:text-mtrix-gold/80">Return & Refund Policy</a>
                        </label>
                        <p className="text-xs text-muted-foreground/60">
                          Please read our policy carefully before placing your order.
                        </p>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-gradient-gold text-mtrix-black hover:shadow-gold transition-all duration-300 py-6 text-lg font-bold"
                      onClick={handlePayment}
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Pay Now <ChevronRight className="w-5 h-5" />
                        </div>
                      )}
                    </Button>

                    {/* Test Payment Bypass Button (Admins Only) */}
                    {isAdmin && (
                      <Button
                        className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold"
                        onClick={async () => {
                          // Validate address first
                          const validation = addressSchema.safeParse(addressData);
                          if (!validation.success) {
                            toast({
                              title: "Validation Error",
                              description: validation.error.errors[0].message,
                              variant: "destructive"
                            });
                            return;
                          }

                          setLoading(true);
                          try {
                            // 1. Create Order
                            const { data: orderData, error: orderError } = await supabase.functions.invoke(
                              'create-razorpay-order',
                              {
                                body: {
                                  shippingAddress: addressData,
                                  couponCode: couponCode
                                }
                              }
                            );

                            if (orderError) throw orderError;

                            // 2. Bypass Payment
                            const { error: bypassError } = await supabase.functions.invoke('bypass-payment', {
                              body: {
                                orderId: orderData.orderId,
                                userId: user?.id
                              }
                            });

                            if (bypassError) throw bypassError;

                            toast({
                              title: "Test Payment Successful",
                              description: "Order placed via bypass mode."
                            });

                            navigate(`/order/${orderData.orderId}`);

                          } catch (error: any) {
                            console.error('Bypass failed:', error);
                            toast({
                              title: "Bypass Failed",
                              description: error.message,
                              variant: "destructive"
                            });
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                      >
                        Test Pay (Bypass Payment)
                      </Button>
                    )}

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="w-3 h-3 text-green-500" />
                      <span>SSL Encrypted Payment</span>
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

export default Checkout;
