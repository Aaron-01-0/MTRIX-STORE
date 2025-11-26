import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Package, Truck, CheckCircle, Clock, ArrowRight, ShoppingBag, MapPin, Calendar, AlertCircle, RefreshCcw, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    name: string;
    image_url?: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  estimated_delivery_date?: string;
  order_items: OrderItem[];
}

const statusSteps = [
  { id: 'pending', label: 'Placed', icon: Clock },
  { id: 'processing', label: 'Processing', icon: Package },
  { id: 'shipping', label: 'Shipped', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const getStatusProgress = (status: string) => {
  const index = statusSteps.findIndex(s => s.id === status);
  if (index === -1) return 0;
  return ((index + 1) / statusSteps.length) * 100;
};

const MyOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchOrders();

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      // Removed image_url from products select as it doesn't exist on the table
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            products (
              name
            )
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch images for products separately
      const ordersWithImages = await Promise.all(data.map(async (order) => {
        const itemsWithImages = await Promise.all(order.order_items.map(async (item: any) => {
          // If product is null (deleted?), handle gracefully
          if (!item.products) {
            return { ...item, products: { name: 'Unknown Product', image_url: null } };
          }

          const { data: imageData } = await supabase
            .from('product_images')
            .select('image_url')
            .eq('product_id', item.product_id)
            .eq('is_main', true)
            .single();

          return {
            ...item,
            products: {
              ...item.products,
              image_url: imageData?.image_url || null
            }
          };
        }));
        return { ...order, order_items: itemsWithImages };
      }));

      setOrders(ordersWithImages as Order[]);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error fetching orders",
        description: error.message || "Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-gold/30">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div>
            <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-white mb-2">
              ORDER <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-white">HISTORY</span>
            </h1>
            <p className="text-muted-foreground">Track and manage your recent purchases</p>
          </div>
          <Button
            variant="outline"
            className="border-gold/30 text-gold hover:bg-gold/10"
            onClick={() => navigate('/catalog')}
          >
            Browse Catalog <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-mtrix-dark/50 rounded-xl animate-pulse border border-mtrix-gray" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-mtrix-dark/30 rounded-3xl border border-mtrix-gray border-dashed">
            <div className="w-20 h-20 bg-mtrix-black rounded-full flex items-center justify-center mx-auto mb-6 border border-mtrix-gray shadow-[0_0_30px_-10px_rgba(255,215,0,0.2)]">
              <ShoppingBag className="w-8 h-8 text-gold" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Orders Yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Your collection is waiting to be started. Explore our latest drops and essentials.
            </p>
            <Button
              className="bg-gradient-gold text-black hover:shadow-gold px-8"
              onClick={() => navigate('/catalog')}
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order, index) => {
              const isRefunded = order.payment_status === 'refunded' || order.payment_status === 'failed';
              const isCancelled = order.status === 'cancelled' || isRefunded;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="group bg-mtrix-dark/50 backdrop-blur-sm border-mtrix-gray hover:border-gold/30 transition-all duration-300 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row">

                        {/* Left: Order Info & Status */}
                        <div className="flex-1 p-6 lg:p-8 space-y-6">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-xl font-orbitron font-bold text-white">
                                  #{order.order_number}
                                </h3>
                                <Badge variant="outline" className={`
                                  ${isRefunded ? 'border-orange-500 text-orange-500 bg-orange-500/10' :
                                    order.status === 'delivered' ? 'border-green-500 text-green-500 bg-green-500/10' :
                                      order.status === 'cancelled' ? 'border-red-500 text-red-500 bg-red-500/10' :
                                        'border-gold text-gold bg-gold/10'}
                                `}>
                                  {isRefunded ? 'REFUNDED' : order.status.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(order.created_at), 'PPP')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-gold">₹{order.total_amount}</p>
                              <p className="text-xs text-muted-foreground">{order.order_items.length} Items</p>
                            </div>
                          </div>

                          {/* Progress Bar (Hide if cancelled or refunded) */}
                          {!isCancelled && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs font-medium text-muted-foreground px-1">
                                {statusSteps.map((step) => (
                                  <span key={step.id} className={order.status === step.id || getStatusProgress(order.status) >= getStatusProgress(step.id) ? 'text-gold' : ''}>
                                    {step.label}
                                  </span>
                                ))}
                              </div>
                              <div className="h-2 bg-mtrix-black rounded-full overflow-hidden border border-mtrix-gray/30">
                                <motion.div
                                  className="h-full bg-gradient-gold"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${getStatusProgress(order.status)}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Refund/Cancel Message */}
                          {isRefunded && (
                            <div className="flex items-center gap-2 text-xs text-orange-500 bg-orange-500/10 px-3 py-2 rounded-lg border border-orange-500/20">
                              <RefreshCcw className="w-3 h-3" /> Payment has been refunded. Order closed.
                            </div>
                          )}
                          {!isRefunded && order.status === 'cancelled' && (
                            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                              <AlertTriangle className="w-3 h-3" /> Order cancelled.
                            </div>
                          )}

                          {/* Order Actions */}
                          <div className="flex flex-wrap gap-3 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-mtrix-gray hover:bg-white/5"
                              onClick={() => navigate(`/order/${order.id}`)}
                            >
                              View Details
                            </Button>
                            {order.status === 'delivered' && (
                              <Button size="sm" className="bg-white text-black hover:bg-gray-200">
                                Write Review
                              </Button>
                            )}
                            {!isCancelled && order.status === 'processing' && (
                              <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">
                                <Package className="w-3 h-3" /> Preparing for dispatch
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Product Previews */}
                        <div className="lg:w-1/3 bg-black/20 border-t lg:border-t-0 lg:border-l border-mtrix-gray p-6 flex flex-col justify-center">
                          <div className="space-y-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Items in Order</p>
                            {order.order_items.slice(0, 3).map((item) => (
                              <div key={item.id} className="flex items-center gap-3 group/item">
                                <div className="w-12 h-12 rounded bg-mtrix-black border border-mtrix-gray overflow-hidden">
                                  <img
                                    src={item.products?.image_url || '/placeholder.svg'}
                                    alt={item.products?.name || 'Product'}
                                    className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-300 truncate">{item.products?.name || 'Unknown Product'}</p>
                                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                </div>
                              </div>
                            ))}
                            {order.order_items.length > 3 && (
                              <p className="text-xs text-gold hover:underline cursor-pointer pl-1">
                                + {order.order_items.length - 3} more items...
                              </p>
                            )}
                          </div>
                        </div>

                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyOrders;
