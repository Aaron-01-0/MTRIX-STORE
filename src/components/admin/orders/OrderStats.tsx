import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Clock, TrendingUp } from "lucide-react";

interface OrderStatsProps {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    averageOrderValue: number;
}

const OrderStats: React.FC<OrderStatsProps> = ({
    totalRevenue,
    totalOrders,
    pendingOrders,
    averageOrderValue,
}) => {
    const stats = [
        {
            title: "Total Revenue",
            value: `₹${totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            description: "Lifetime revenue",
            color: "text-mtrix-gold",
            bgColor: "bg-mtrix-gold/10",
            borderColor: "border-mtrix-gold/20",
        },
        {
            title: "Total Orders",
            value: totalOrders.toString(),
            icon: ShoppingBag,
            description: "All time orders",
            color: "text-blue-400",
            bgColor: "bg-blue-400/10",
            borderColor: "border-blue-400/20",
        },
        {
            title: "Pending Orders",
            value: pendingOrders.toString(),
            icon: Clock,
            description: "Requires attention",
            color: "text-orange-400",
            bgColor: "bg-orange-400/10",
            borderColor: "border-orange-400/20",
        },
        {
            title: "Avg. Order Value",
            value: `₹${Math.round(averageOrderValue).toLocaleString()}`,
            icon: TrendingUp,
            description: "Per order average",
            color: "text-purple-400",
            bgColor: "bg-purple-400/10",
            borderColor: "border-purple-400/20",
        },
    ];

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <Card
                    key={index}
                    className={`border bg-mtrix-dark/50 backdrop-blur-sm ${stat.borderColor} hover:shadow-glow transition-all duration-300`}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">
                            {stat.title}
                        </CardTitle>
                        <div className={`p-2.5 rounded-xl ${stat.bgColor} transition-colors duration-200`}>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white tracking-tight font-orbitron">{stat.value}</div>
                        <p className="text-xs text-gray-500 mt-1 font-medium">{stat.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default OrderStats;
