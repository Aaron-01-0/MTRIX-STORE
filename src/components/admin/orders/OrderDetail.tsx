import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Printer,
    Mail,
    MapPin,
    User,
    CreditCard,
    Package,
    Truck,
    Calendar,
    Loader2,
    ExternalLink,
    Undo2
} from "lucide-react";
import { format } from 'date-fns';

interface OrderDetail {
    id: string;
    order_number: string;
    total_amount: number;
    status: string;
    payment_status: string;
    created_at: string;
    shipping_address: any;
    tracking_number?: string;
    tracking_url?: string;
    user: {
        email: string;
        first_name: string | null;
        last_name: string | null;
        full_name?: string;
        mobile_no?: string;
    } | null;
    items: {
        id: string;
        quantity: number;
        price: number;
        product: {
            name: string;
            sku: string;
            image_url?: string;
        };
        variant?: {
            variant_name: string;
        };
    }[];
    invoice_number?: string | null;
    discount_amount?: number;
    coupon_code?: string;
}



const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [processingRefund, setProcessingRefund] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [trackingUrl, setTrackingUrl] = useState('');

    useEffect(() => {
        if (id) fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        setLoading(true);
        try {
            // 1. Fetch Order and Items
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select(`
                    *,
                    items: order_items(
                        id,
                        quantity,
                        price,
                        variant_id,
                        product: products(name, sku, product_images(image_url))
                    )
                `)
                .eq('id', id)
                .single();

            if (orderError) throw orderError;

            // 2. Fetch Profile manually
            let userProfile = null;
            if (orderData.user_id) {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('first_name, last_name, mobile_no, name')
                    .eq('user_id', orderData.user_id)
                    .maybeSingle();

                if (!profileError && profileData) {
                    userProfile = profileData;
                }
            }

            // 3. Fetch Variants manually
            const variantIds = orderData.items
                .map((item: any) => item.variant_id)
                .filter((id: any) => id !== null);

            let variantsMap = new Map();
            if (variantIds.length > 0) {
                const { data: variantsData, error: variantsError } = await supabase
                    .from('product_variants')
                    .select('id, variant_name')
                    .in('id', variantIds);

                if (!variantsError && variantsData) {
                    variantsMap = new Map(variantsData.map(v => [v.id, v]));
                }
            }

            // 4. Fetch Invoice
            const { data: invoiceData } = await supabase
                .from('invoices')
                .select('invoice_number')
                .eq('order_id', id)
                .maybeSingle();

            const formattedOrder = {
                ...orderData,
                invoice_number: invoiceData?.invoice_number,
                user: userProfile ? {
                    first_name: userProfile.first_name,
                    last_name: userProfile.last_name,
                    mobile_no: userProfile.mobile_no,
                    email: userProfile.email || (orderData.shipping_address as any)?.email || 'No email',
                    full_name: userProfile.first_name ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim() : userProfile.name
                } : {
                    email: (orderData.shipping_address as any)?.email || 'No email',
                    full_name: (orderData.shipping_address as any)?.name || 'Guest'
                },
                items: orderData.items.map((item: any) => ({
                    ...item,
                    product: {
                        ...item.product,
                        image_url: item.product?.product_images?.[0]?.image_url || null
                    },
                    variant: item.variant_id ? variantsMap.get(item.variant_id) : null
                }))
            };

            setOrder(formattedOrder as any);
            if (orderData.tracking_number) setTrackingNumber(orderData.tracking_number);
            if (orderData.tracking_url) setTrackingUrl(orderData.tracking_url);
        } catch (error: any) {
            console.error('Error fetching order details:', error);
            toast({
                title: "Error",
                description: "Failed to fetch order details: " + (error.message || "Unknown error"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (newStatus: string) => {
        if (!order) return;
        setUpdating(true);
        try {
            const updateData: any = { status: newStatus };

            // If shipping, include tracking info
            if (newStatus === 'shipped' || order.status === 'shipped') {
                updateData.tracking_number = trackingNumber;
                updateData.tracking_url = trackingUrl;
            }

            const { error } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', order.id);

            if (error) throw error;

            setOrder({ ...order, ...updateData });
            toast({
                title: "Success",
                description: `Order status updated to ${newStatus} `,
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to update status",
                variant: "destructive",
            });
        } finally {
            setUpdating(false);
        }
    };

    const saveTracking = async () => {
        if (!order) return;
        setUpdating(true);
        try {
            const updatePayload: any = {};
            if (trackingNumber) updatePayload.tracking_number = trackingNumber;
            if (trackingUrl) updatePayload.tracking_url = trackingUrl;

            console.log('Sending tracking update payload:', updatePayload);

            const { error } = await supabase
                .from('orders')
                .update(updatePayload)
                .eq('id', order.id);

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }

            setOrder({ ...order, ...updatePayload });
            toast({
                title: "Success",
                description: "Tracking details saved",
            });
        } catch (error: any) {
            console.error('Error saving tracking:', error);
            toast({
                title: "Error",
                description: "Failed to save tracking details: " + (error.message || error.details || "Unknown error"),
                variant: "destructive",
            });
        } finally {
            setUpdating(false);
        }
    };

    const [sendingEmail, setSendingEmail] = useState(false);
    const [printingInvoice, setPrintingInvoice] = useState(false);

    const handlePrintInvoice = async () => {
        if (!order) return;
        setPrintingInvoice(true);
        try {
            const { data, error } = await supabase.functions.invoke('generate-invoice', {
                body: { order_id: order.id }
            });

            if (error) throw error;

            if (data?.url) {
                window.open(data.url, '_blank');
            } else {
                throw new Error('No invoice URL returned');
            }
        } catch (error: any) {
            console.error('Error printing invoice:', error);
            toast({
                title: "Error",
                description: "Failed to generate invoice",
                variant: "destructive",
            });
        } finally {
            setPrintingInvoice(false);
        }
    };

    const handleEmailInvoice = async () => {
        if (!order) return;
        setSendingEmail(true);
        try {
            // 1. Ensure Invoice Exists (Generate if needed)
            const { data: genData, error: genError } = await supabase.functions.invoke('generate-invoice', {
                body: { order_id: order.id }
            });
            if (genError) throw genError;

            // 2. Send Email
            const { data, error } = await supabase.functions.invoke('send-invoice-email', {
                body: { order_id: order.id }
            });

            if (error) throw error;
            if (data && !data.success) {
                throw new Error(data.error || 'Failed to send email');
            }

            toast({
                title: "Success",
                description: "Invoice sent to customer",
            });
        } catch (error: any) {
            console.error('Error sending invoice email:', error);
            toast({
                title: "Error",
                description: "Failed to send invoice email: " + (error.message || "Unknown error"),
                variant: "destructive",
            });
        } finally {
            setSendingEmail(false);
        }
    };

    const handleRefund = async () => {
        if (!order || !confirm('Are you sure you want to refund this order? This action cannot be undone.')) return;

        setProcessingRefund(true);
        try {
            // 1. Get the payment transaction for this order
            const { data: transaction, error: txError } = await supabase
                .from('payment_transactions')
                .select('razorpay_payment_id, amount')
                .eq('order_id', order.id)
                .eq('status', 'captured')
                .single();

            if (txError || !transaction) {
                throw new Error('No captured payment found for this order');
            }

            // 2. Process refund
            const { data, error } = await supabase.functions.invoke('process-refund', {
                body: {
                    payment_id: transaction.razorpay_payment_id,
                    amount: transaction.amount
                },
            });

            if (error) throw error;

            if (data.success) {
                toast({
                    title: 'Success',
                    description: 'Refund processed successfully',
                });
                setOrder({ ...order, payment_status: 'refunded' });
            } else {
                throw new Error(data.error || 'Refund failed');
            }
        } catch (error: any) {
            console.error('Error processing refund:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to process refund',
                variant: 'destructive',
            });
        } finally {
            setProcessingRefund(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-mtrix-gold" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4 text-gray-400">
                <p>Order not found</p>
                <Button onClick={() => navigate('/admin/orders')} variant="outline" className="border-mtrix-gold text-mtrix-gold hover:bg-mtrix-gold/10">Back to Orders</Button>
            </div>
        );
    }

    return (
        <>


            {/* Screen View */}
            <div className="space-y-6 animate-fade-in print:hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-mtrix-dark/50 backdrop-blur-sm p-6 rounded-xl border border-mtrix-gray shadow-sm">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/orders')} className="hover:bg-mtrix-gray/50 rounded-full h-10 w-10 text-gray-400">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold tracking-tight text-white font-orbitron">Order #{order.order_number}</h2>
                                <Badge variant="secondary" className="capitalize font-normal bg-mtrix-gray/30 text-mtrix-gold border-mtrix-gold/30">
                                    {order.status}
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                                <Calendar className="h-4 w-4" />
                                Placed on {format(new Date(order.created_at), 'MMMM d, yyyy')} at {format(new Date(order.created_at), 'h:mm a')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-mtrix-black border-mtrix-gray hover:bg-mtrix-gray text-white"
                            onClick={handlePrintInvoice}
                            disabled={printingInvoice}
                        >
                            {printingInvoice ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Printer className="h-4 w-4 mr-2" />
                            )}
                            Print Invoice
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-mtrix-black border-mtrix-gray hover:bg-mtrix-gray text-white"
                            onClick={handleEmailInvoice}
                            disabled={sendingEmail}
                        >
                            {sendingEmail ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Mail className="h-4 w-4 mr-2" />
                            )}
                            Email
                        </Button>
                        {order.payment_status === 'paid' && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleRefund}
                                disabled={processingRefund}
                                className="bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                            >
                                <Undo2 className={`h - 4 w - 4 mr - 2 ${processingRefund ? 'animate-spin' : ''} `} />
                                Refund Order
                            </Button>
                        )}
                        <Select
                            value={order.status}
                            onValueChange={updateStatus}
                            disabled={updating}
                        >
                            <SelectTrigger className="w-[180px] bg-mtrix-black border-mtrix-gray text-white">
                                <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-mtrix-dark border-mtrix-gray text-white">
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items */}
                        <Card className="border-mtrix-gray bg-mtrix-dark/50 backdrop-blur-sm shadow-sm overflow-hidden">
                            <CardHeader className="bg-mtrix-black/30 border-b border-mtrix-gray pb-4">
                                <CardTitle className="text-lg font-semibold text-white">Order Items</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-mtrix-black/50 hover:bg-mtrix-black/50 border-mtrix-gray">
                                            <TableHead className="pl-6 font-semibold text-gray-400">Product</TableHead>
                                            <TableHead className="text-right font-semibold text-gray-400">Price</TableHead>
                                            <TableHead className="text-right font-semibold text-gray-400">Qty</TableHead>
                                            <TableHead className="text-right pr-6 font-semibold text-gray-400">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.items.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-mtrix-gray/20 border-mtrix-gray">
                                                <TableCell className="pl-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-lg bg-mtrix-black border border-mtrix-gray flex items-center justify-center overflow-hidden">
                                                            {item.product?.image_url ? (
                                                                <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <Package className="h-6 w-6 text-gray-600" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-white">{item.product?.name || 'Unknown Product'}</span>
                                                            <span className="text-sm text-gray-500">SKU: {item.product?.sku}</span>
                                                            {item.variant && (
                                                                <Badge variant="outline" className="w-fit mt-1 text-xs bg-mtrix-black text-gray-400 border-mtrix-gray">
                                                                    {item.variant.variant_name}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-white">₹{item.price.toLocaleString()}</TableCell>
                                                <TableCell className="text-right text-gray-400">{item.quantity}</TableCell>
                                                <TableCell className="text-right pr-6 font-semibold text-mtrix-gold">
                                                    ₹{(item.price * item.quantity).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-mtrix-black/30 hover:bg-mtrix-black/30 border-mtrix-gray">
                                            <TableCell colSpan={3} className="text-right font-medium text-gray-400 pt-6">Subtotal</TableCell>
                                            <TableCell className="text-right pr-6 font-medium text-white pt-6">₹{order.total_amount.toLocaleString()}</TableCell>
                                        </TableRow>
                                        <TableRow className="bg-mtrix-black/30 hover:bg-mtrix-black/30 border-0">
                                            <TableCell colSpan={3} className="text-right font-medium text-gray-400">Shipping</TableCell>
                                            <TableCell className="text-right pr-6 font-medium text-white">₹0.00</TableCell>
                                        </TableRow>
                                        {order.discount_amount > 0 && (
                                            <TableRow className="bg-mtrix-black/30 hover:bg-mtrix-black/30 border-0">
                                                <TableCell colSpan={3} className="text-right font-medium text-emerald-400">Discount ({order.coupon_code})</TableCell>
                                                <TableCell className="text-right pr-6 font-medium text-emerald-400">-₹{order.discount_amount.toLocaleString()}</TableCell>
                                            </TableRow>
                                        )}
                                        <TableRow className="bg-mtrix-black/50 hover:bg-mtrix-black/50 border-t border-mtrix-gray">
                                            <TableCell colSpan={3} className="text-right font-bold text-lg text-mtrix-gold py-6">Total</TableCell>
                                            <TableCell className="text-right pr-6 font-bold text-lg text-mtrix-gold py-6">₹{order.total_amount.toLocaleString()}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Tracking Info - Only show if shipped or has tracking */}
                        <div className="">
                            {(order.status === 'shipped' || order.status === 'delivered' || trackingNumber) && (
                                <Card className="border-mtrix-gray bg-mtrix-dark/50 backdrop-blur-sm shadow-sm">
                                    <CardHeader className="bg-mtrix-black/30 border-b border-mtrix-gray pb-4">
                                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
                                            <Truck className="h-4 w-4 text-mtrix-gold" />
                                            Tracking Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-gray-400">Tracking Number</Label>
                                                <Input
                                                    value={trackingNumber}
                                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                                    placeholder="Enter tracking number"
                                                    className="bg-mtrix-black border-mtrix-gray text-white focus:border-mtrix-gold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-gray-400">Tracking URL</Label>
                                                <Input
                                                    value={trackingUrl}
                                                    onChange={(e) => setTrackingUrl(e.target.value)}
                                                    placeholder="https://..."
                                                    className="bg-mtrix-black border-mtrix-gray text-white focus:border-mtrix-gold"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            {trackingUrl && (
                                                <Button variant="outline" size="sm" onClick={() => {
                                                    let url = trackingUrl;
                                                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                                        url = 'https://' + url;
                                                    }
                                                    window.open(url, '_blank');
                                                }} className="border-mtrix-gray text-gray-300 hover:text-white hover:bg-mtrix-gray">
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Track Package
                                                </Button>
                                            )}
                                            <Button size="sm" onClick={saveTracking} disabled={updating} className="bg-mtrix-gold text-black hover:bg-mtrix-gold-light">
                                                Save Tracking
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Customer Details */}
                        <Card className="border-mtrix-gray bg-mtrix-dark/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <User className="h-4 w-4 text-mtrix-gold" />
                                    Customer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-mtrix-black border border-mtrix-gray flex items-center justify-center text-mtrix-gold font-medium">
                                        {order.user?.full_name?.charAt(0) || 'G'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{order.user?.full_name || 'Guest User'}</p>
                                        <p className="text-sm text-gray-500">Customer</p>
                                    </div>
                                </div>
                                <Separator className="bg-mtrix-gray" />
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Mail className="h-4 w-4" />
                                        <a href={`mailto: ${order.user?.email} `} className="hover:text-mtrix-gold transition-colors">
                                            {order.user?.email}
                                        </a>
                                    </div>
                                    {order.user?.mobile_no && (
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <User className="h-4 w-4" />
                                            {order.user.mobile_no}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Shipping Address */}
                        <Card className="border-mtrix-gray bg-mtrix-dark/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <MapPin className="h-4 w-4 text-mtrix-gold" />
                                    Shipping Address
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-gray-400 space-y-1">
                                {order.shipping_address ? (
                                    <>
                                        <p className="font-medium text-white">{order.shipping_address.full_name}</p>
                                        <p>{order.shipping_address.address_line_1}</p>
                                        {order.shipping_address.address_line_2 && <p>{order.shipping_address.address_line_2}</p>}
                                        <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}</p>
                                        <p>{order.shipping_address.country || 'India'}</p>
                                        <p className="mt-2 text-gray-500">{order.shipping_address.phone}</p>
                                    </>
                                ) : (
                                    <p className="text-gray-500 italic">No shipping address provided</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payment Info */}
                        <Card className="border-mtrix-gray bg-mtrix-dark/50 backdrop-blur-sm shadow-sm">
                            <CardHeader className="bg-mtrix-black/30 border-b border-mtrix-gray pb-4">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
                                    <CreditCard className="h-4 w-4 text-mtrix-gold" />
                                    Payment Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="flex justify-between items-center p-3 bg-mtrix-black rounded-lg border border-mtrix-gray">
                                    <span className="text-sm font-medium text-gray-400">Status</span>
                                    <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'} className={order.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}>
                                        {order.payment_status}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-mtrix-black rounded-lg border border-mtrix-gray">
                                    <span className="text-sm font-medium text-gray-400">Method</span>
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm font-semibold text-white">Razorpay</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-mtrix-black rounded-lg border border-mtrix-gray">
                                    <span className="text-sm font-medium text-gray-400">Transaction ID</span>
                                    <span className="text-sm font-mono text-gray-500">#ORD-{order.order_number.slice(-6)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OrderDetail;
