import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    Download,
    Printer,
    ChevronLeft,
    ChevronRight,
    Loader2,
    ArrowUpDown
} from "lucide-react";
import { format } from 'date-fns';
import { exportToCSV } from '@/utils/exportUtils';
import OrderStats from './OrderStats';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Order {
    id: string;
    order_number: string;
    total_amount: number;
    status: string;
    payment_status: string;
    created_at: string;
    user: {
        email: string;
        first_name: string | null;
        last_name: string | null;
        full_name?: string;
    } | null;
}

const OrderList = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        averageOrderValue: 0,
    });
    const pageSize = 10;

    useEffect(() => {
        fetchOrders();
        fetchStats();
    }, [page, statusFilter, searchTerm]);

    const fetchStats = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('total_amount, status');

            if (error) throw error;

            const totalOrders = data.length;
            const validOrders = data.filter(order => !['cancelled', 'refunded'].includes(order.status));
            const totalRevenue = validOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
            const pendingOrders = data.filter(order => order.status === 'pending').length;
            const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            setStats({
                totalRevenue,
                totalOrders,
                pendingOrders,
                averageOrderValue,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('orders')
                .select('*', { count: 'exact' });

            if (statusFilter !== 'all') {
                if (statusFilter === 'pending') {
                    // Include 'order_created' and 'paid' in the "New/Pending" tab
                    query = query.in('status', ['pending', 'order_created', 'paid']);
                } else {
                    query = query.eq('status', statusFilter);
                }
            }

            if (searchTerm) {
                query = query.or(`order_number.ilike.%${searchTerm}%`);
            }

            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data: ordersData, error: ordersError, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (ordersError) throw ordersError;

            // 2. Fetch profiles manually
            const userIds = [...new Set((ordersData || []).map(o => o.user_id))];
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('user_id, first_name, last_name, name')
                .in('user_id', userIds);

            if (profilesError) console.error('Error fetching profiles:', profilesError);

            const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

            const formattedOrders = (ordersData || []).map((order: any) => {
                const profile = profilesMap.get(order.user_id);
                return {
                    ...order,
                    user: profile ? {
                        first_name: profile.first_name,
                        last_name: profile.last_name,
                        email: 'No email', // Profile doesn't have email
                        full_name: profile.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : profile.name
                    } : null
                };
            });

            setOrders(formattedOrders);
            if (count) setTotalPages(Math.ceil(count / pageSize));
        } catch (error: any) {
            console.error('Error fetching orders:', error);
            toast({
                title: "Error fetching orders",
                description: error.message || "Unknown error occurred",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        if (newStatus === 'shipped') {
            // Find order object to pass to shipped dialog
            const order = orders.find(o => o.id === orderId);
            if (order) handleMarkAsShippedClick(order);
            return;
        }

        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            toast({
                title: "Status Updated",
                description: `Order status changed to ${newStatus}`,
            });

            // Auto-send email notification
            toast({ title: "Sending Notification...", description: "Triggering email update..." });
            supabase.functions.invoke('send-order-confirmation', {
                body: { orderId: orderId }
            }).then(({ error: emailError }) => {
                if (emailError) {
                    console.error("Email trigger failed:", emailError);
                    toast({ title: "Email Failed", description: "Could not send notification.", variant: "destructive" });
                } else {
                    toast({ title: "Email Sent", description: "Customer notified of update." });
                }
            });

            fetchOrders();
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedOrders(orders.map(o => o.id));
        } else {
            setSelectedOrders([]);
        }
    };

    const handleSelectOrder = (orderId: string, checked: boolean) => {
        if (checked) {
            setSelectedOrders([...selectedOrders, orderId]);
        } else {
            setSelectedOrders(selectedOrders.filter(id => id !== orderId));
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'delivered': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'shipped': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'processing': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'cancelled': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'pending':
            case 'order_created':
            case 'paid': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    const getPaymentStatusColor = (status: string) => {
        return status === 'paid'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    };

    const [shippedDialogOpen, setShippedDialogOpen] = useState(false);
    const [selectedOrderForShipping, setSelectedOrderForShipping] = useState<Order | null>(null);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [trackingUrl, setTrackingUrl] = useState('');
    const [updating, setUpdating] = useState(false);

    const handleMarkAsShippedClick = (order: Order) => {
        setSelectedOrderForShipping(order);
        setShippedDialogOpen(true);
        setTrackingNumber('');
        setTrackingUrl('');
    };

    const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);

    const handlePrintInvoice = async (orderId: string) => {
        setPrintingOrderId(orderId);
        try {
            const { data, error } = await supabase.functions.invoke('generate-invoice', {
                body: { order_id: orderId }
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
            setPrintingOrderId(null);
        }
    };

    const handleConfirmShipped = async () => {
        if (!selectedOrderForShipping) return;
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    status: 'shipped',
                    tracking_number: trackingNumber,
                    tracking_url: trackingUrl
                })
                .eq('id', selectedOrderForShipping.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Order marked as shipped",
            });

            // Auto-send email notification
            toast({ title: "Sending Notification...", description: "Triggering email update..." });
            supabase.functions.invoke('send-order-confirmation', {
                body: { orderId: selectedOrderForShipping.id }
            }).then(({ error: emailError }) => {
                if (emailError) {
                    console.error("Email trigger failed:", emailError);
                    toast({ title: "Email Failed", description: "Could not send notification.", variant: "destructive" });
                } else {
                    toast({ title: "Email Sent", description: "Customer notified of shipping." });
                }
            });

            setShippedDialogOpen(false);
            fetchOrders(); // Refresh list
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to update order",
                variant: "destructive",
            });
        } finally {
            setUpdating(false);
        }
    };

    const handleBulkExport = () => {
        const ordersToExport = orders.filter(o => selectedOrders.includes(o.id));
        const exportData = ordersToExport.map(order => ({
            'Order Number': order.order_number,
            'Customer Name': order.user?.full_name || 'Guest',
            'Customer Email': order.user?.email || '',
            'Date': new Date(order.created_at).toLocaleDateString(),
            'Total Amount': order.total_amount,
            'Status': order.status,
            'Payment Status': order.payment_status
        }));

        exportToCSV(exportData, `orders_export_${new Date().toISOString().split('T')[0]}`);
    };

    const handleBulkPrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <OrderStats {...stats} />

            {/* Tabs & Actions */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
                            <TabsList className="bg-mtrix-dark/50 border border-mtrix-gray p-1 h-auto flex-wrap justify-start">
                                <TabsTrigger value="all" className="data-[state=active]:bg-mtrix-gold data-[state=active]:text-black text-gray-400 font-orbitron tracking-wide text-xs">ALL</TabsTrigger>
                                <TabsTrigger value="pending" className="data-[state=active]:bg-mtrix-gold data-[state=active]:text-black text-gray-400 font-orbitron tracking-wide text-xs">NEW / PENDING</TabsTrigger>
                                <TabsTrigger value="processing" className="data-[state=active]:bg-mtrix-gold data-[state=active]:text-black text-gray-400 font-orbitron tracking-wide text-xs">PROCESSING</TabsTrigger>
                                <TabsTrigger value="shipped" className="data-[state=active]:bg-mtrix-gold data-[state=active]:text-black text-gray-400 font-orbitron tracking-wide text-xs">SHIPPED</TabsTrigger>
                                <TabsTrigger value="delivered" className="data-[state=active]:bg-mtrix-gold data-[state=active]:text-black text-gray-400 font-orbitron tracking-wide text-xs">DELIVERED</TabsTrigger>
                                <TabsTrigger value="cancelled" className="data-[state=active]:bg-mtrix-gold data-[state=active]:text-black text-gray-400 font-orbitron tracking-wide text-xs">CANCELLED</TabsTrigger>
                            </TabsList>

                            {selectedOrders.length > 0 && (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5">
                                    <span className="text-sm text-gray-400 font-medium">{selectedOrders.length} selected</span>
                                    <Button onClick={handleBulkPrint} variant="outline" size="sm" className="bg-mtrix-black border-mtrix-gray hover:bg-mtrix-gray text-white">
                                        <Printer className="h-4 w-4 mr-2" />
                                        Print
                                    </Button>
                                    <Button onClick={handleBulkExport} variant="outline" size="sm" className="bg-mtrix-black border-mtrix-gray hover:bg-mtrix-gray text-white">
                                        <Download className="h-4 w-4 mr-2" />
                                        Export
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Search Bar (Global) */}
                        <div className="relative w-full sm:w-72 mb-4">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by order #..."
                                className="pl-9 bg-mtrix-black border-mtrix-gray focus:border-mtrix-gold text-white transition-all duration-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </Tabs>
                </div>
            </div>

            {/* Table */}
            <div className="bg-mtrix-dark/50 backdrop-blur-sm rounded-xl border border-mtrix-gray shadow-sm overflow-hidden min-h-[400px]">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-mtrix-black/50 hover:bg-mtrix-black/50 border-mtrix-gray">
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedOrders.length === orders.length && orders.length > 0}
                                    onCheckedChange={handleSelectAll}
                                    className="border-gray-500 data-[state=checked]:bg-mtrix-gold data-[state=checked]:border-mtrix-gold"
                                />
                            </TableHead>
                            <TableHead className="font-semibold text-gray-400">Order #</TableHead>
                            <TableHead className="font-semibold text-gray-400">Customer</TableHead>
                            <TableHead className="font-semibold text-gray-400">Date</TableHead>
                            <TableHead className="font-semibold text-gray-400">Status</TableHead>
                            <TableHead className="font-semibold text-gray-400">Payment</TableHead>
                            <TableHead className="text-right font-semibold text-gray-400">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow className="border-mtrix-gray">
                                <TableCell colSpan={8} className="h-32 text-center">
                                    <div className="flex flex-col justify-center items-center gap-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-mtrix-gold" />
                                        <span className="text-sm text-gray-400">Loading orders...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow className="border-mtrix-gray">
                                <TableCell colSpan={8} className="h-32 text-center text-gray-500">
                                    No orders found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id} className="hover:bg-mtrix-gray/20 transition-colors duration-200 border-mtrix-gray">
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedOrders.includes(order.id)}
                                            onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                                            className="border-gray-500 data-[state=checked]:bg-mtrix-gold data-[state=checked]:border-mtrix-gold"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium text-white font-orbitron tracking-wide">{order.order_number}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm text-gray-200">{order.user?.full_name || 'Guest'}</span>
                                            <span className="text-xs text-gray-500">{order.user?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-400">{format(new Date(order.created_at), 'MMM d, yyyy')}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="focus:outline-none">
                                                <Badge
                                                    variant="secondary"
                                                    className={`capitalize font-normal border cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(order.status)}`}
                                                >
                                                    {order.status} <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />
                                                </Badge>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-mtrix-dark border-mtrix-gray text-white">
                                                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                                <DropdownMenuSeparator className="bg-mtrix-gray" />
                                                <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'processing')}>Processing</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'shipped')}>Shipped</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'delivered')}>Delivered</DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-mtrix-gray" />
                                                <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'cancelled')} className="text-red-400">Cancelled</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`capitalize font-normal ${getPaymentStatusColor(order.payment_status)}`}>
                                            {order.payment_status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-mtrix-gold">
                                        ₹{order.total_amount.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-mtrix-gray/50 rounded-full text-gray-400">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[160px] bg-mtrix-dark border-mtrix-gray text-white">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => navigate(`/admin/orders/${order.id}`)} className="cursor-pointer hover:bg-mtrix-gray/50 focus:bg-mtrix-gray/50">
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-mtrix-gray" />
                                                <DropdownMenuItem
                                                    onClick={() => handleMarkAsShippedClick(order)}
                                                    className="cursor-pointer hover:bg-mtrix-gray/50 focus:bg-mtrix-gray/50"
                                                >
                                                    Mark as Shipped
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handlePrintInvoice(order.id)}
                                                    className="cursor-pointer hover:bg-mtrix-gray/50 focus:bg-mtrix-gray/50"
                                                    disabled={printingOrderId === order.id}
                                                >
                                                    {printingOrderId === order.id ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Printer className="mr-2 h-4 w-4" />
                                                    )}
                                                    Print Invoice
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2">
                <div className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="bg-mtrix-black border-mtrix-gray hover:bg-mtrix-gray text-white disabled:opacity-50"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="bg-mtrix-black border-mtrix-gray hover:bg-mtrix-gray text-white disabled:opacity-50"
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Mark as Shipped Dialog */}
            {selectedOrderForShipping && (
                <Dialog open={shippedDialogOpen} onOpenChange={setShippedDialogOpen}>
                    <DialogContent className="bg-mtrix-dark border-mtrix-gray text-white sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Mark Order as Shipped</DialogTitle>
                            <DialogDescription className="text-gray-400">
                                Enter tracking details for order #{selectedOrderForShipping.order_number}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="tracking-number" className="text-right text-gray-300">
                                    Tracking #
                                </Label>
                                <Input
                                    id="tracking-number"
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    className="col-span-3 bg-mtrix-black border-mtrix-gray text-white focus:border-mtrix-gold"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="tracking-url" className="text-right text-gray-300">
                                    Tracking URL
                                </Label>
                                <Input
                                    id="tracking-url"
                                    value={trackingUrl}
                                    onChange={(e) => setTrackingUrl(e.target.value)}
                                    className="col-span-3 bg-mtrix-black border-mtrix-gray text-white focus:border-mtrix-gold"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShippedDialogOpen(false)} className="border-mtrix-gray text-white hover:bg-mtrix-gray">
                                Cancel
                            </Button>
                            <Button onClick={handleConfirmShipped} disabled={updating} className="bg-mtrix-gold text-black hover:bg-mtrix-gold-light">
                                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Shipped'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default OrderList;
