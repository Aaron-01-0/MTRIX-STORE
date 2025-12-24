import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Ticket, Copy, Check, Clock, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UserReward {
    id: string;
    is_used: boolean;
    used_at?: string;
    code: string;
    expires_at: string;
    coupons: {
        description: string;
        discount_value: number;
        discount_type: string;
    };
}

const MyCoupons = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [rewards, setRewards] = useState<UserReward[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        if (user) fetchRewards();
    }, [user]);

    const fetchRewards = async () => {
        try {
            // Fetch from user_rewards (Wheel & Arena both use this now hopefully, or migrating)
            const { data, error } = await supabase
                .from('user_rewards')
                .select(`
                  id,
                  is_used,
                  used_at,
                  code,
                  expires_at,
                  coupons:coupon_id (
                    description,
                    discount_value,
                    discount_type
                  )
                `)
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRewards((data as any[]) || []);
        } catch (error) {
            console.error('Error fetching rewards:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyCode = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        toast({ title: "Copied!", description: "Coupon code copied to clipboard." });
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (loading) return <div className="text-center py-8 text-gray-500">Loading rewards...</div>;

    if (rewards.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No Rewards Yet</h3>
                <p className="text-gray-400">Spin the wheel or participate in the Arena to win!</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {rewards.map((item) => (
                <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className={cn(
                        "overflow-hidden relative group transition-colors",
                        item.is_used
                            ? "bg-gray-900/50 border-gray-800 opacity-75 grayscale"
                            : "bg-gradient-to-r from-purple-900/20 to-black border-purple-500/30"
                    )}>
                        <div className={cn(
                            "absolute left-0 top-0 bottom-0 w-2",
                            item.is_used
                                ? "bg-gray-700"
                                : "bg-gradient-to-b from-purple-500 to-pink-500"
                        )} />

                        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn(
                                        "text-2xl font-bold tracking-wider font-mono",
                                        item.is_used ? "text-gray-500 line-through" : "text-white"
                                    )}>
                                        {item.code}
                                    </span>
                                    {!item.is_used && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-gray-400 hover:text-white"
                                            onClick={() => copyCode(item.code, item.id)}
                                        >
                                            {copiedId === item.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                    )}
                                    {item.is_used && (
                                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">USED</span>
                                    )}
                                </div>

                                <p className={cn(
                                    "font-medium",
                                    item.is_used ? "text-gray-500" : "text-purple-300"
                                )}>
                                    {item.coupons?.description || "Special Reward"}
                                </p>

                                <div className="flex flex-col gap-1 mt-2">
                                    {item.is_used && item.used_at ? (
                                        <p className="text-xs text-amber-500/80 flex items-center gap-1">
                                            <ShoppingBag className="w-3 h-3" />
                                            Used on {new Date(item.used_at).toLocaleDateString()} at {new Date(item.used_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Expires: {new Date(item.expires_at).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="text-right">
                                <div className={cn(
                                    "text-3xl font-bold",
                                    item.is_used
                                        ? "text-gray-600"
                                        : "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600"
                                )}>
                                    {item.coupons?.discount_type === 'percentage'
                                        ? `${item.coupons.discount_value}% OFF`
                                        : item.coupons?.discount_type === 'free_shipping'
                                            ? 'FREE SHIP'
                                            : `₹${item.coupons.discount_value}`
                                    }
                                </div>
                                <div className="text-xs text-gray-400 uppercase tracking-wider">
                                    {item.is_used ? 'Redeemed' : 'Available'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
};

export default MyCoupons;
