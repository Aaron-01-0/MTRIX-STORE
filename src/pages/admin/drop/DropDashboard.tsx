import { Activity, Users, ShoppingBag, DollarSign, PauseCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import KPICard from "@/components/admin/drop/KPICard";
import { Badge } from "@/components/ui/badge";

const DropDashboard = () => {
    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-orbitron font-bold text-white mb-2">DASHBOARD</h1>
                    <div className="flex items-center gap-3">
                        <Badge className="bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20 animate-pulse">
                            LIVE DROP ACTIVE
                        </Badge>
                        <span className="text-gray-400 text-sm">Started 12 mins ago</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button variant="destructive" className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20">
                        <PauseCircle className="w-4 h-4 mr-2" />
                        PAUSE PURCHASES
                    </Button>
                    <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white">
                        <XCircle className="w-4 h-4 mr-2" />
                        END DROP
                    </Button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Live Viewers"
                    value="1,248"
                    change="+12%"
                    trend="up"
                    icon={Users}
                    color="cyan"
                />
                <KPICard
                    title="Purchases / Min"
                    value="42"
                    change="+5.4%"
                    trend="up"
                    icon={ShoppingBag}
                    color="magenta"
                />
                <KPICard
                    title="Revenue"
                    value="$12.4k"
                    change="+8.2%"
                    trend="up"
                    icon={DollarSign}
                />
                <KPICard
                    title="Remaining Stock"
                    value="86"
                    change="-14"
                    trend="down"
                    icon={Activity}
                />
            </div>

            {/* Live Activity Feed Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-mtrix-charcoal/50 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-orbitron font-bold text-white mb-6">LIVE TRAFFIC</h3>
                    <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-lg">
                        <p className="text-gray-500">Real-time traffic chart placeholder</p>
                    </div>
                </div>

                <div className="bg-mtrix-charcoal/50 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-orbitron font-bold text-white mb-6">RECENT ORDERS</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center text-neon-cyan text-xs font-bold">
                                        ORD
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Order #{1000 + i}</p>
                                        <p className="text-xs text-gray-400">2 mins ago</p>
                                    </div>
                                </div>
                                <span className="text-neon-cyan font-mono font-bold">$120.00</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DropDashboard;
