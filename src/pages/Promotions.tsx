import { useState, useEffect } from 'react';
import { Calendar, Copy, Gift, Percent, Tag, TrendingUp, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_value: number;
  max_discount_amount: number | null;
  valid_from: string;
  valid_until: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
}

const Promotions = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .is('allowed_emails', null)
        .order('discount_value', { ascending: false });

      if (error) throw error;

      // Filter out Reward Wheel prizes
      const HIDDEN_CODES = ['WELCOME10', 'FREESHIP', 'LUCKY15', 'MYSTERY_UNLOCK', 'FOUNDER', 'GOLDEN20'];
      const visibleCoupons = (data || []).filter(c => !HIDDEN_CODES.includes(c.code) && !c.code.startsWith('WELCOME10-'));

      setCoupons(visibleCoupons);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied code: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No expiry';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isExpiringSoon = (dateString: string | null) => {
    if (!dateString) return false;
    const daysUntilExpiry = Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% OFF`;
    }
    return `₹${coupon.discount_value} OFF`;
  };

  const getCouponGradient = (index: number) => {
    const gradients = [
      'from-purple-500/20 to-pink-500/20',
      'from-blue-500/20 to-cyan-500/20',
      'from-orange-500/20 to-red-500/20',
      'from-green-500/20 to-emerald-500/20',
      'from-yellow-500/20 to-amber-500/20',
    ];
    return gradients[index % gradients.length];
  };


  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        {/* Hero Section */}
        <section className="py-20 px-6 bg-gradient-to-br from-primary/10 via-background to-background relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
          <div className="container mx-auto text-center relative z-10">
            <div className="inline-block mb-4">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-sm px-4 py-1.5">
                <Sparkles className="w-4 h-4 mr-1 inline" />
                Exclusive Offers
              </Badge>
            </div>
            <h1 className="text-6xl font-orbitron font-bold text-gradient-gold mb-6">
              Save Big with MTRIX
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Unlock exclusive discounts and special offers. Use promo codes at checkout to maximize your savings!
            </p>
          </div>
        </section>

        {/* Active Coupons Grid */}
        <section className="py-16 px-6">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-orbitron font-bold text-gradient-gold mb-2">
                  Active Coupon Codes
                </h2>
                <p className="text-muted-foreground">
                  {coupons.length} active {coupons.length === 1 ? 'offer' : 'offers'} available
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-primary/30" />
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4" />
                <p className="text-muted-foreground">Loading amazing deals...</p>
              </div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-20">
                <Gift className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-foreground mb-2">No Active Promotions</h3>
                <p className="text-muted-foreground mb-6">Check back soon for exciting offers!</p>
                <Button
                  onClick={() => navigate('/catalog')}
                  className="bg-gradient-gold text-mtrix-black hover:shadow-gold"
                >
                  Browse Products
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((coupon, index) => {
                  const isExpiring = isExpiringSoon(coupon.valid_until);
                  const usagePercentage = coupon.usage_limit
                    ? ((coupon.used_count / coupon.usage_limit) * 100)
                    : 0;
                  const isAlmostGone = usagePercentage > 80;

                  return (
                    <Card
                      key={coupon.id}
                      className={`group relative overflow-hidden bg-gradient-to-br ${getCouponGradient(index)} border-border/50 hover:border-primary/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20`}
                    >
                      {/* Decorative Elements */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-500" />

                      <CardContent className="p-6 relative z-10">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Percent className="w-5 h-5 text-primary" />
                              <Badge className="bg-primary text-mtrix-black font-bold text-lg px-3 py-1">
                                {getDiscountDisplay(coupon)}
                              </Badge>
                            </div>
                            {(isExpiring || isAlmostGone) && (
                              <div className="flex flex-wrap gap-2">
                                {isExpiring && (
                                  <Badge variant="outline" className="border-orange-500 text-orange-500 text-xs">
                                    Expiring Soon!
                                  </Badge>
                                )}
                                {isAlmostGone && coupon.usage_limit && (
                                  <Badge variant="outline" className="border-red-500 text-red-500 text-xs">
                                    Limited Stock
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <Tag className="w-6 h-6 text-primary/50" />
                        </div>

                        {/* Description */}
                        <h3 className="text-lg font-semibold text-foreground mb-4 min-h-[3rem] line-clamp-2">
                          {coupon.description || `Get ${getDiscountDisplay(coupon)} on your order`}
                        </h3>

                        {/* Details */}
                        <div className="space-y-2 mb-5">
                          {coupon.min_order_value > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Min. Order:</span>
                              <span className="text-foreground font-semibold">₹{coupon.min_order_value}</span>
                            </div>
                          )}

                          {coupon.max_discount_amount && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Max. Saving:</span>
                              <span className="text-primary font-semibold">₹{coupon.max_discount_amount}</span>
                            </div>
                          )}

                          {coupon.valid_until && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Valid Until:</span>
                              <span className={`flex items-center font-medium ${isExpiring ? 'text-orange-500' : 'text-foreground'}`}>
                                <Calendar className="w-3.5 h-3.5 mr-1" />
                                {formatDate(coupon.valid_until)}
                              </span>
                            </div>
                          )}

                          {coupon.usage_limit && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Available:</span>
                              <span className={`font-semibold ${isAlmostGone ? 'text-red-500' : 'text-foreground'}`}>
                                {coupon.usage_limit - coupon.used_count} / {coupon.usage_limit}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Coupon Code */}
                        <div className="relative">
                          <div className="flex items-center gap-2 p-3 bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary/30 rounded-lg group-hover:border-primary/60 transition-all">
                            <code className="flex-1 text-center font-mono font-bold text-primary text-lg tracking-wider">
                              {coupon.code}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyCouponCode(coupon.code)}
                              className="hover:bg-primary/20 transition-all"
                            >
                              {copiedCode === coupon.code ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* CTA Button */}
                        <Button
                          onClick={() => navigate('/catalog')}
                          className="w-full mt-4 bg-gradient-gold text-mtrix-black hover:shadow-gold transition-all duration-300 font-semibold"
                        >
                          Shop Now
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* How to Use Section */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="container mx-auto">
            <h2 className="text-3xl font-orbitron font-bold text-gradient-gold mb-12 text-center">
              How to Redeem Your Coupon
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-mtrix-black">1</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Copy Code</h3>
                <p className="text-sm text-muted-foreground">Click the copy button on your chosen coupon</p>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-mtrix-black">2</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Shop Products</h3>
                <p className="text-sm text-muted-foreground">Add items to cart and proceed to checkout</p>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-mtrix-black">3</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Apply & Save</h3>
                <p className="text-sm text-muted-foreground">Paste code at checkout and enjoy savings</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-6 bg-gradient-to-br from-primary/20 via-background to-background">
          <div className="container mx-auto text-center">
            <Gift className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-4xl font-orbitron font-bold text-gradient-gold mb-4">
              Ready to Save?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-lg">
              Start shopping now and use these amazing coupons to get the best deals on premium products
            </p>

            <Button
              onClick={() => navigate('/catalog')}
              size="lg"
              className="bg-gradient-gold text-mtrix-black hover:shadow-gold transition-all duration-300 text-lg px-8 py-6 hover:scale-105"
            >
              Browse All Products
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Promotions;