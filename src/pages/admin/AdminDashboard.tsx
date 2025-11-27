import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, ShoppingBag, Users, TrendingUp, ArrowUpRight, Package, RotateCcw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReturnManager from "@/components/admin/ReturnManager";

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        revenue: 0,
        orders: 0,
        customers: 0,
        avgOrderValue: 0
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // 1. Fetch Orders
            const { data: orders, error } = await supabase
                .from('orders')
                .select('id, total_amount, created_at, status, payment_status, profiles(full_name)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // 2. Calculate KPIs
            // Only count revenue for valid orders (not pending, cancelled, or failed payment)
            const validRevenueOrders = orders.filter(order =>
                order.status !== 'pending' &&
                order.status !== 'cancelled' &&
                order.payment_status !== 'failed' &&
                order.payment_status !== 'pending'
            );

            const totalRevenue = validRevenueOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
            const totalOrders = orders.length;
            const uniqueCustomers = new Set(orders.map(o => o.profiles?.full_name)).size;
            const avgOrderValue = validRevenueOrders.length > 0 ? totalRevenue / validRevenueOrders.length : 0;

            setStats({
                revenue: totalRevenue,
                orders: totalOrders,
                customers: uniqueCustomers,
                avgOrderValue
            });

            setRecentOrders(orders.slice(0, 5));

            // 3. Prepare Chart Data (Last 7 Days)
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = subDays(new Date(), 6 - i);
                return format(d, 'yyyy-MM-dd');
            });

            const dailySales = last7Days.map(date => {
                const dayOrders = validRevenueOrders.filter(o => o.created_at.startsWith(date));
                const dayRevenue = dayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
                return {
                    date: format(new Date(date), 'MMM dd'),
                    revenue: dayRevenue
                };
            });

            setChartData(dailySales);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-white">Loading Dashboard...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-orbitron font-bold text-white mb-2">Dashboard</h1>
                <p className="text-muted-foreground">Overview of your store's performance.</p>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-black/40 border border-white/10">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-gold data-[state=active]:text-black">Overview</TabsTrigger>
                    <TabsTrigger value="returns" className="data-[state=active]:bg-gold data-[state=active]:text-black">
                        Returns & Exchanges
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KpiCard
                            title="Total Revenue"
                            value={`₹${stats.revenue.toLocaleString()}`}
                            icon={DollarSign}
                            trend="+12.5%"
                        />
                        <KpiCard
                            title="Total Orders"
                            value={stats.orders.toString()}
                            icon={ShoppingBag}
                            trend="+5.2%"
                        />
                        <KpiCard
                            title="Active Customers"
                            value={stats.customers.toString()}
                            icon={Users}
                            trend="+2.1%"
                        />
                        <KpiCard
                            title="Avg. Order Value"
                            value={`₹${Math.round(stats.avgOrderValue).toLocaleString()}`}
                            icon={TrendingUp}
                            trend="+8.4%"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Sales Chart */}
                        <Card className="lg:col-span-2 bg-mtrix-black border-mtrix-gray">
                            <CardHeader>
                                <CardTitle className="text-white">Revenue Overview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                            <XAxis dataKey="date" stroke="#888" tickLine={false} axisLine={false} />
                                            <YAxis stroke="#888" tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                                itemStyle={{ color: '#FFD700' }}
                                            />
                                            <Area type="monotone" dataKey="revenue" stroke="#FFD700" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Orders */}
                        <Card className="bg-mtrix-black border-mtrix-gray">
                            <CardHeader>
                                <CardTitle className="text-white">Recent Orders</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {recentOrders.map((order) => (
                                        <div key={order.id} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{order.profiles?.full_name || 'Guest'}</p>
                                                    <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), 'MMM dd, HH:mm')}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-white">₹{order.total_amount}</p>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                    order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {order.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="returns">
                    <ReturnManager />
                </TabsContent>
            </Tabs>
        </div>
    );
};

const KpiCard = ({ title, value, icon: Icon, trend }: any) => (
    <Card className="bg-mtrix-black border-mtrix-gray hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-green-400 text-xs font-medium bg-green-400/10 px-2 py-1 rounded">
                    {trend} <ArrowUpRight className="w-3 h-3" />
                </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
            <p className="text-sm text-muted-foreground">{title}</p>
        </CardContent>
    </Card>
);

export default AdminDashboard;
