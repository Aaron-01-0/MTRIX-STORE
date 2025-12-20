import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, Truck, Eye, Calendar, MapPin, CreditCard, Download, FileText, RefreshCcw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { exportToCSV } from '@/utils/exportUtils';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    sku: string;
    weight: number | null;
    dimensions: any;
  };
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  shipping_address: any;
  user_id: string;
  tracking_number?: string;
  tracking_url?: string;
  estimated_delivery_date?: string;
  invoice_url?: string;
  profiles?: {
    full_name: string | null;
    email?: string; // Optional, might not exist in profiles
  };
}

const OrderManager = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const [trackingData, setTrackingData] = useState({
    tracking_number: '',
    tracking_url: '',
    estimated_delivery_date: ''
  });

  const fetchSingleOrder = async (orderId: string) => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, status, payment_status, created_at, shipping_address, user_id, tracking_number, tracking_url, estimated_delivery_date, invoice_url')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      if (!orderData) return null;

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, name')
        .eq('user_id', orderData.user_id)
        .single();

      return {
        ...orderData,
        profiles: profileData ? {
          full_name: profileData.first_name ? `${profileData.first_name} ${profileData.last_name || ''}`.trim() : profileData.name
        } : null
      };
    } catch (error) {
      console.error('Error fetching single order:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('admin-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = await fetchSingleOrder(payload.new.id);
            if (newOrder) {
              setOrders((prev) => [newOrder as any, ...prev]);
              toast({
                title: "New Order Received!",
                description: `Order #${newOrder.order_number} has been placed.`,
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((order) =>
                order.id === payload.new.id ? { ...order, ...payload.new } : order
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((order) => order.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      // 1. Fetch Orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, status, payment_status, created_at, shipping_address, user_id, tracking_number, tracking_url, estimated_delivery_date, invoice_url')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        return;
      }

      // 2. Fetch Profiles
      const userIds = [...new Set(ordersData.map(o => o.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, name')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // 3. Map Profiles
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      const ordersWithProfiles = ordersData.map(order => {
        const profile = profilesMap.get(order.user_id);
        return {
          ...order,
          profiles: profile ? {
            full_name: profile.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : profile.name
          } : null
        };
      });

      setOrders(ordersWithProfiles as any);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch orders: ' + (error.message || 'Unknown error'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    setLoadingItems(true);
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          price,
          product:product_id (
            name,
            sku,
            weight,
            dimensions
          )
        `)
        .eq('order_id', orderId);

      if (error) throw error;
      setOrderItems(data as any || []);
    } catch (error) {
      console.error('Error fetching order items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load order details',
        variant: 'destructive'
      });
    } finally {
      setLoadingItems(false);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    fetchOrderItems(order.id);
    setShowDetailDialog(true);
  };

  const handleRegenerateInvoice = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      toast({
        title: "Generating Invoice...",
        description: "Please wait while we generate the invoice.",
      });

      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { order_id: orderId }
      });

      if (error) throw error;

      if (data?.url) {
        // Update local state
        const timestamp = new Date().getTime();
        const urlWithCacheBust = `${data.url}?t=${timestamp}`;

        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, invoice_url: urlWithCacheBust } : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, invoice_url: urlWithCacheBust } : null);
        }

        toast({
          title: "Invoice Generated",
          description: "Invoice has been successfully generated.",
        });

        // Open it
        window.open(urlWithCacheBust, '_blank');
      }
    } catch (error: any) {
      console.error('Invoice generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Could not generate invoice.",
        variant: "destructive"
      });
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Order status updated'
      });

      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));

      // Trigger email if status is shipped or delivered
      if (['shipped', 'delivered'].includes(status)) {
        const order = orders.find(o => o.id === orderId);
        if (order && order.profiles?.email) {
          try {
            await supabase.functions.invoke('send-order-email', {
              body: {
                email: order.profiles.email,
                type: status,
                orderNumber: order.order_number,
                customerName: order.profiles.full_name,
                trackingNumber: order.tracking_number,
                trackingUrl: order.tracking_url,
                amount: order.total_amount.toString()
              }
            });
            toast({
              title: "Email Sent",
              description: `Customer notified about ${status} status.`
            });
          } catch (emailError) {
            console.error('Failed to send email:', emailError);
            toast({
              title: "Email Failed",
              description: "Status updated but failed to send email notification.",
              variant: "destructive"
            });
          }
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive'
      });
    }
  };

  const updateTracking = async () => {
    if (!selectedOrder) return;

    try {
      const updatePayload: any = {};

      if (trackingData.tracking_number) updatePayload.tracking_number = trackingData.tracking_number;
      if (trackingData.tracking_url) updatePayload.tracking_url = trackingData.tracking_url;

      if (trackingData.estimated_delivery_date) {
        // Ensure valid ISO string
        updatePayload.estimated_delivery_date = new Date(trackingData.estimated_delivery_date).toISOString();
      } else {
        updatePayload.estimated_delivery_date = null;
      }

      console.log('Sending update payload:', updatePayload);

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', selectedOrder.id);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Tracking details updated'
      });
      setShowTrackingDialog(false);

      // Optimistic update
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? {
        ...o,
        ...updatePayload
      } : o));
    } catch (error: any) {
      console.error('Error updating tracking:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tracking: ' + (error.message || error.details || 'Unknown error'),
        variant: 'destructive'
      });
    }
  };

  const openTrackingDialog = (order: Order) => {
    setSelectedOrder(order);
    setTrackingData({
      tracking_number: order.tracking_number || '',
      tracking_url: order.tracking_url || '',
      estimated_delivery_date: order.estimated_delivery_date?.split('T')[0] || ''
    });
    setShowTrackingDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      order_created: 'default',
      processing: 'default',
      shipping: 'default',
      out_for_delivery: 'default',
      delivered: 'default',
      cancelled: 'destructive'
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleExport = () => {
    const exportData = orders.map(order => ({
      'Order Number': order.order_number,
      'Customer Name': order.profiles?.full_name || 'Guest',
      'Customer Email': order.profiles?.email || '',
      'Date': new Date(order.created_at).toLocaleDateString(),
      'Total Amount': order.total_amount,
      'Status': order.status,
      'Payment Status': order.payment_status,
      'Tracking Number': order.tracking_number || '',
      'Shipping Address': order.shipping_address ?
        `${order.shipping_address.address_line1}, ${order.shipping_address.city}, ${order.shipping_address.state}` : ''
    }));

    exportToCSV(exportData, `orders_export_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-orbitron font-bold text-gradient-gold">Order Management</h2>
          <p className="text-muted-foreground">Track and manage customer orders.</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="border-mtrix-gray hover:bg-white/10">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card className="bg-mtrix-dark border-mtrix-gray">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-mtrix-gray hover:bg-white/5">
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="border-mtrix-gray hover:bg-white/5">
                  <TableCell className="font-medium text-white">{order.order_number}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-white">{order.profiles?.full_name || 'Guest'}</span>
                      <span className="text-xs text-muted-foreground">{order.profiles?.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="font-bold text-primary">₹{order.total_amount}</TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value) => updateOrderStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-[140px] h-8 bg-mtrix-black border-mtrix-gray">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="order_created">Created</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipping">Shipping</SelectItem>
                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`uppercase text-[10px] ${order.payment_status === 'paid' || order.payment_status === 'success'
                        ? 'border-green-500 text-green-500 bg-green-500/10'
                        : order.payment_status === 'refunded'
                          ? 'border-orange-500 text-orange-500 bg-orange-500/10'
                          : 'border-red-500 text-red-500 bg-red-500/10'
                        }`}
                    >
                      {order.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openTrackingDialog(order)}
                        title="Update Tracking"
                      >
                        <Truck className={`w-4 h-4 ${order.tracking_number ? 'text-primary' : 'text-gray-400'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(order)}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-gray-400 hover:text-white" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tracking Dialog */}
      <Dialog open={showTrackingDialog} onOpenChange={setShowTrackingDialog}>
        <DialogContent className="bg-mtrix-dark border-mtrix-gray">
          <DialogHeader>
            <DialogTitle>Update Tracking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tracking Number</Label>
              <Input
                value={trackingData.tracking_number}
                onChange={(e) => setTrackingData({ ...trackingData, tracking_number: e.target.value })}
                className="bg-mtrix-black border-mtrix-gray"
              />
            </div>
            <div className="space-y-2">
              <Label>Tracking URL</Label>
              <Input
                value={trackingData.tracking_url}
                onChange={(e) => setTrackingData({ ...trackingData, tracking_url: e.target.value })}
                placeholder="https://..."
                className="bg-mtrix-black border-mtrix-gray"
              />
            </div>
            <div className="space-y-2">
              <Label>Estimated Delivery</Label>
              <Input
                type="date"
                value={trackingData.estimated_delivery_date}
                onChange={(e) => setTrackingData({ ...trackingData, estimated_delivery_date: e.target.value })}
                className="bg-mtrix-black border-mtrix-gray"
              />
            </div>
            <Button onClick={updateTracking} className="w-full bg-primary text-black hover:bg-primary/90">
              Save Tracking Details
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-mtrix-dark border-mtrix-gray max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span>Order #{selectedOrder?.order_number}</span>
                <Badge variant="outline" className="ml-2">{selectedOrder?.status}</Badge>
              </div>
              <div className="flex gap-2">
                {selectedOrder?.invoice_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-mtrix-gray hover:bg-white/10"
                    onClick={() => window.open(selectedOrder.invoice_url, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" /> Invoice
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                  onClick={(e) => selectedOrder && handleRegenerateInvoice(selectedOrder.id, e)}
                  title="Regenerate Invoice"
                >
                  <RefreshCcw className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              {/* Customer & Shipping Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Customer
                  </h4>
                  <div className="bg-mtrix-black p-3 rounded-md border border-mtrix-gray text-sm">
                    <p className="font-medium text-white">{selectedOrder?.profiles?.full_name || 'Guest'}</p>
                    <p className="text-gray-400">{selectedOrder?.profiles?.email}</p>
                    <p className="text-gray-400 mt-1">User ID: {selectedOrder?.user_id}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Shipping Address
                  </h4>
                  <div className="bg-mtrix-black p-3 rounded-md border border-mtrix-gray text-sm">
                    {selectedOrder?.shipping_address ? (
                      <>
                        <p>{selectedOrder.shipping_address.address_line1}</p>
                        {selectedOrder.shipping_address.address_line2 && <p>{selectedOrder.shipping_address.address_line2}</p>}
                        <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.postal_code}</p>
                        <p>{selectedOrder.shipping_address.country}</p>
                      </>
                    ) : (
                      <p className="text-gray-500 italic">No shipping address provided</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Order Items
                </h4>
                <div className="border border-mtrix-gray rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-mtrix-black">
                      <TableRow className="border-mtrix-gray">
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Specs</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingItems ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">Loading items...</TableCell>
                        </TableRow>
                      ) : orderItems.map((item) => (
                        <TableRow key={item.id} className="border-mtrix-gray">
                          <TableCell className="font-medium text-white">{item.product?.name || 'Unknown Product'}</TableCell>
                          <TableCell className="text-xs font-mono text-gray-400">{item.product?.sku}</TableCell>
                          <TableCell className="text-xs text-gray-400">
                            {item.product?.weight && <div>Weight: {item.product.weight}kg</div>}
                            {item.product?.dimensions && (
                              <div>
                                {item.product.dimensions.width}x{item.product.dimensions.height}x{item.product.dimensions.depth}cm
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">₹{item.price}</TableCell>
                          <TableCell className="text-right font-medium text-primary">₹{item.price * item.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Order Summary */}
              <div className="flex justify-end">
                <div className="w-64 bg-mtrix-black p-4 rounded-md border border-mtrix-gray space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-white">₹{selectedOrder?.total_amount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Shipping</span>
                    <span className="text-white">₹0.00</span>
                  </div>
                  <div className="border-t border-mtrix-gray pt-2 flex justify-between font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-primary">₹{selectedOrder?.total_amount}</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManager;
