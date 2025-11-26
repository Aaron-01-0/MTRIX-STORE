import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Package, CreditCard, Clock, Truck, MessageSquare, CheckCircle, ArrowRight, Download, XCircle, AlertTriangle, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';
import ProductReview from '@/components/ProductReview';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product_id: string;
  variant_id?: string;
  products: {
    name: string;
    image_url?: string;
  };
  product_variants?: {
    variant_name: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  currency: string;
  shipping_address: any;
  tracking_number?: string;
  tracking_url?: string;
  estimated_delivery_date?: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

const statusSteps = [
  { id: 'pending', label: 'Order Placed', icon: CheckCircle },
  { id: 'processing', label: 'Processing', icon: Package },
  { id: 'shipping', label: 'Shipped', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: MapPin },
];

const getStepStatus = (currentStatus: string, stepId: string) => {
  if (currentStatus === 'cancelled') return 'cancelled';

  const statusOrder = ['pending', 'order_created', 'processing', 'shipping', 'out_for_delivery', 'delivered'];
  const currentIndex = statusOrder.indexOf(currentStatus);
  const stepIndex = statusOrder.indexOf(stepId);

  // Map 'order_created' to 'pending' step for simplicity if needed, or treat as same level
  if (currentStatus === 'order_created' && stepId === 'pending') return 'completed';

  if (currentIndex >= stepIndex) return 'completed';
  return 'upcoming';
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewFor, setShowReviewFor] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchOrder();

    // Set up real-time subscription
    const channel = supabase
      .channel('order-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          console.log('Order updated:', payload);
          setOrder((prev) => prev ? { ...prev, ...payload.new } : null);
          toast({
            title: "Order Updated",
            description: "Your order status has been updated",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, id, navigate, toast]);

  useEffect(() => {
    if (order) {
      const isRefunded = order.payment_status === 'refunded' || order.payment_status === 'failed';
      const isCancelled = order.status === 'cancelled';

      if (!isCancelled && !isRefunded && order.status !== 'pending') {
        // Trigger confetti only for successful/confirmed orders
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => {
          return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function () {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
      }
    }
  }, [order]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            product_id,
            variant_id,
            products (
              name
            ),
            product_variants (
              variant_name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch product images
      if (data?.order_items) {
        const productIds = data.order_items.map((item: any) => item.product_id);
        const { data: images } = await supabase
          .from('product_images')
          .select('product_id, image_url')
          .in('product_id', productIds)
          .eq('is_main', true);

        data.order_items = data.order_items.map((item: any) => ({
          ...item,
          products: {
            ...item.products,
            image_url: images?.find((img) => img.product_id === item.product_id)?.image_url,
          },
        }));
      }

      setOrder(data as Order);
    } catch (error: any) {
      console.error('Error fetching order:', error);
      toast({
        title: "Error",
        description: "Failed to fetch order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-gold text-xl font-orbitron">Loading Order Details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="text-2xl font-orbitron text-red-500">Order Not Found</div>
        <Button onClick={() => navigate('/')} variant="outline">Return Home</Button>
      </div>
    );
  }

  const isRefunded = order.payment_status === 'refunded' || order.payment_status === 'failed';
  const isCancelled = order.status === 'cancelled' || isRefunded; // Treat refunded as cancelled visually

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-gold/30">
      <Navbar />

      <main className="container mx-auto px-4 py-8 pt-24 max-w-5xl">
        {/* Dynamic Header */}
        <div className="text-center mb-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">

          {isRefunded ? (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-500/10 mb-4 border border-orange-500/20 shadow-[0_0_30px_-5px_rgba(249,115,22,0.3)]">
                <RefreshCcw className="w-10 h-10 text-orange-500" />
              </div>
              <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-orange-500">
                Payment Refunded
              </h1>
              <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                The payment for order <span className="text-white font-mono">#{order.order_number}</span> has been refunded. This order is now closed.
              </p>
            </>
          ) : isCancelled ? (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-4 border border-red-500/20 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-red-500">
                Order Cancelled
              </h1>
              <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                This order <span className="text-white font-mono">#{order.order_number}</span> has been cancelled.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-4 border border-green-500/20 shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)]">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-gradient-gold">
                Order Confirmed!
              </h1>
              <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                Thank you for your purchase. Your order <span className="text-gold font-mono">#{order.order_number}</span> has been received.
              </p>
            </>
          )}

          <div className="flex justify-center gap-4 pt-4">
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-gold text-mtrix-black hover:shadow-gold transition-all duration-300"
            >
              Continue Shopping <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            {!isCancelled && (
              <Button
                variant="outline"
                className="border-mtrix-gray hover:bg-mtrix-gray/20"
                onClick={async () => {
                  if (!order) return;
                  const { data } = supabase.storage
                    .from('invoices')
                    .getPublicUrl(`${order.order_number}.pdf`);

                  if (data?.publicUrl) {
                    window.open(data.publicUrl, '_blank');
                  } else {
                    toast({
                      title: "Error",
                      description: "Invoice not found",
                      variant: "destructive"
                    });
                  }
                }}
              >
                <Download className="mr-2 w-4 h-4" /> Invoice
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Order Details */}
          <div className="lg:col-span-2 space-y-8">

            {/* Timeline (Hide if cancelled or refunded) */}
            {!isCancelled && (
              <Card className="bg-mtrix-dark/50 backdrop-blur-sm border-mtrix-gray overflow-hidden">
                <CardContent className="p-8">
                  <div className="relative flex justify-between">
                    {/* Connecting Line */}
                    <div className="absolute top-5 left-0 w-full h-0.5 bg-mtrix-gray -z-10" />

                    {statusSteps.map((step, index) => {
                      const status = getStepStatus(order.status, step.id);
                      const isCompleted = status === 'completed';
                      const isCurrent = order.status === step.id || (order.status === 'order_created' && step.id === 'pending');

                      return (
                        <div key={step.id} className="flex flex-col items-center gap-3 bg-mtrix-dark px-2">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
                            ${isCompleted || isCurrent
                              ? 'bg-gold border-gold text-mtrix-black shadow-[0_0_15px_rgba(255,215,0,0.4)]'
                              : 'bg-mtrix-black border-mtrix-gray text-muted-foreground'}
                          `}>
                            <step.icon className="w-5 h-5" />
                          </div>
                          <span className={`text-xs md:text-sm font-medium ${isCompleted || isCurrent ? 'text-gold' : 'text-muted-foreground'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {isRefunded && (
              <Card className="bg-orange-500/5 border-orange-500/20">
                <CardContent className="p-6 flex items-center gap-4">
                  <AlertTriangle className="w-6 h-6 text-orange-500" />
                  <div>
                    <h3 className="text-lg font-bold text-orange-500">Refund Processed</h3>
                    <p className="text-muted-foreground">
                      A refund has been initiated for this order. It may take 5-7 business days to reflect in your account.
                      <br />
                      <span className="text-xs opacity-70">Note: Order processing has been stopped automatically.</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isRefunded && isCancelled && (
              <Card className="bg-red-500/5 border-red-500/20">
                <CardContent className="p-6 flex items-center gap-4">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <div>
                    <h3 className="text-lg font-bold text-red-500">Order Cancelled</h3>
                    <p className="text-muted-foreground">This order has been cancelled and will not be processed. If you have been charged, a refund will be initiated shortly.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Items List */}
            <Card className="bg-mtrix-dark/50 backdrop-blur-sm border-mtrix-gray">
              <CardHeader>
                <CardTitle className="font-orbitron text-xl flex items-center gap-2">
                  <Package className="w-5 h-5 text-gold" />
                  Items Ordered
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-mtrix-gray group-hover:border-gold/50 transition-colors">
                      {item.products.image_url ? (
                        <img
                          src={item.products.image_url}
                          alt={item.products.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-mtrix-gray/20 flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="font-medium text-lg text-white group-hover:text-gold transition-colors">
                        {item.products.name}
                      </h4>
                      {item.product_variants && (
                        <Badge variant="secondary" className="w-fit mt-1 bg-mtrix-gray/30 text-xs">
                          {item.product_variants.variant_name}
                        </Badge>
                      )}
                      <p className="text-sm text-muted-foreground mt-2">
                        Qty: {item.quantity} × {order.currency} {item.price}
                      </p>
                    </div>
                    <div className="text-right flex flex-col justify-center items-end gap-2">
                      <p className="font-bold text-lg text-gold">
                        {order.currency} {item.price * item.quantity}
                      </p>
                      {order.status === 'delivered' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowReviewFor(item.product_id)}
                          className="text-xs hover:text-gold hover:bg-gold/10"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Write Review
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Review Form */}
                {showReviewFor && order.status === 'delivered' && (
                  <div className="mt-4 pt-4 border-t border-mtrix-gray animate-in fade-in slide-in-from-top-2">
                    <ProductReview
                      orderId={order.id}
                      productId={showReviewFor}
                      productName={
                        order.order_items.find(item => item.product_id === showReviewFor)?.products.name || 'Product'
                      }
                      onReviewSubmitted={() => {
                        setShowReviewFor(null);
                        toast({
                          title: "Success",
                          description: "Review submitted successfully"
                        });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReviewFor(null)}
                      className="mt-2 text-muted-foreground hover:text-white"
                    >
                      Cancel Review
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Summary & Info */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="bg-mtrix-dark/50 backdrop-blur-sm border-mtrix-gray">
              <CardHeader>
                <CardTitle className="font-orbitron text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{order.currency} {order.total_amount}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="text-green-400">Free</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span>Included</span>
                  </div>
                </div>
                <Separator className="bg-mtrix-gray" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg text-white">Total</span>
                  <span className="font-bold text-xl text-gold">{order.currency} {order.total_amount}</span>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Info */}
            <Card className="bg-mtrix-dark/50 backdrop-blur-sm border-mtrix-gray">
              <CardHeader>
                <CardTitle className="font-orbitron text-lg flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gold" />
                  Shipping Details
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                {order.shipping_address && (
                  <>
                    <p className="text-white font-medium">To:</p>
                    <p>{order.shipping_address.address_line_1}</p>
                    {order.shipping_address.address_line_2 && <p>{order.shipping_address.address_line_2}</p>}
                    <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}</p>
                    <p className="pt-2 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Est. Delivery: {order.estimated_delivery_date ? format(new Date(order.estimated_delivery_date), 'MMM dd, yyyy') : '3-5 Business Days'}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card className="bg-mtrix-dark/50 backdrop-blur-sm border-mtrix-gray">
              <CardHeader>
                <CardTitle className="font-orbitron text-lg flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gold" />
                  Payment Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Method</span>
                  <span className="text-white font-medium flex items-center gap-2">
                    Razorpay <CheckCircle className="w-3 h-3 text-green-500" />
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant={order.payment_status === 'success' ? 'default' : 'secondary'}
                    className={
                      order.payment_status === 'success'
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : order.payment_status === 'refunded'
                          ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                    }
                  >
                    {order.payment_status.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderDetail;