import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Ticket, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserCoupon {
    id: string;
    status: string;
    coupons: {
        code: string;
        description: string;
        discount_value: number;
        discount_type: string;
        valid_until: string;
    };
}

const MyCoupons = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [coupons, setCoupons] = useState<UserCoupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        if (user) fetchCoupons();
    }, [user]);

    const fetchCoupons = async () => {
        try {
            const { data, error } = await supabase
                .from('user_coupons')
                .select(`
          id,
          status,
          coupons (
            code,
            description,
            discount_value,
            discount_type,
            valid_until
          )
        `)
                .eq('user_id', user!.id)
                .eq('status', 'active');

            if (error) throw error;
            setCoupons((data as any[]) || []);
        } catch (error) {
            console.error('Error fetching coupons:', error);
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

    if (coupons.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No Active Coupons</h3>
                <p className="text-gray-400">Participate in the Arena to win rewards!</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {coupons.map((item) => (
                <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="bg-gradient-to-r from-purple-900/20 to-black border-purple-500/30 overflow-hidden relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-purple-500 to-pink-500" />
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-2xl font-bold text-white tracking-wider font-mono">
                                        {item.coupons.code}
                                    </span>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-gray-400 hover:text-white"
                                        onClick={() => copyCode(item.coupons.code, item.id)}
                                    >
                                        {copiedId === item.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                                <p className="text-purple-300 font-medium">{item.coupons.description}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Expires: {new Date(item.coupons.valid_until).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                                    ₹{item.coupons.discount_value}
                                </div>
                                <div className="text-xs text-gray-400 uppercase tracking-wider">Store Credit</div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
};

export default MyCoupons;
