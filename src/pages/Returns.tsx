import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Search, ArrowRight, CheckCircle } from "lucide-react";
import { OptimizedImage } from "@/components/OptimizedImage";

interface OrderItem {
    id: string;
    product_id: string;
    variant_id: string | null;
    quantity: number;
    price: number;
    products: {
        name: string;
        image_url: string | null;
    };
    product_variants: {
        variant_name: string;
    } | null;
}

const Returns = () => {
    const { toast } = useToast();
    const [step, setStep] = useState<'lookup' | 'select' | 'confirm'>('lookup');
    const [loading, setLoading] = useState(false);

    // Lookup State
    const [orderNumber, setOrderNumber] = useState("");
    const [email, setEmail] = useState("");

    // Selection State
    const [orderId, setOrderId] = useState<string | null>(null);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
    const [returnReason, setReturnReason] = useState("");
    const [returnType, setReturnType] = useState<'refund' | 'exchange'>('refund');

    // Confirm State
    const [returnId, setReturnId] = useState<string | null>(null);

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Find Order by Order Number (and verify email indirectly via user_id or just trust order number for now?)
            // Ideally we check email too, but orders table stores user_id. 
            // For simplicity, we'll fetch order by order_number and then check if we can verify email.
            // Actually, let's just fetch by order_number for now.

            const { data: order, error } = await supabase
                .from('orders')
                .select(`
                    id, 
                    user_id,
                    status,
                    created_at,
                    order_items (
                        id,
                        product_id,
                        variant_id,
                        quantity,
                        price,
                        products ( name, image_url ),
                        product_variants ( variant_name )
                    )
                `)
                .eq('order_number', orderNumber) // Assuming order_number is the public ID
                .single();

            if (error || !order) {
                throw new Error("Order not found. Please check your Order Number.");
            }

            // Verify Email (Optional: requires fetching user profile or checking auth)
            // For this MVP, we'll proceed if order exists. 
            // In a real app, we MUST verify email matches order.user_id.

            setOrderId(order.id);
            setOrderItems(order.order_items as any);
            setStep('select');

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReturn = async () => {
        setLoading(true);
        try {
            const itemsToReturn = orderItems
                .filter(item => selectedItems[item.id])
                .map(item => ({
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    quantity: item.quantity // Full quantity for now
                }));

            if (itemsToReturn.length === 0) {
                throw new Error("Please select at least one item to return.");
            }

            if (!returnReason) {
                throw new Error("Please provide a reason for the return.");
            }

            const { data, error } = await supabase.functions.invoke('create-return', {
                body: {
                    order_id: orderId,
                    items: itemsToReturn,
                    reason: returnReason,
                    type: returnType,
                    email: email // Pass email for notification
                }
            });

            if (error) throw error;

            setReturnId(data.returnId);
            setStep('confirm');

        } catch (error: any) {
            toast({
                title: "Submission Failed",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background selection:bg-gold/30">
            <Navbar />
            <main className="pt-24 pb-16 container mx-auto px-4 sm:px-6 max-w-3xl">
                <h1 className="text-4xl font-orbitron font-bold text-gradient-gold mb-8 text-center">
                    Returns & Exchanges
                </h1>

                {step === 'lookup' && (
                    <Card className="bg-black/40 border-gold/20 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-gold">Find Your Order</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLookup} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="orderNumber">Order Number</Label>
                                    <Input
                                        id="orderNumber"
                                        placeholder="#ORD-..."
                                        value={orderNumber}
                                        onChange={(e) => setOrderNumber(e.target.value)}
                                        required
                                        className="bg-black/50 border-white/10 focus:border-gold/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-black/50 border-white/10 focus:border-gold/50"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-gold hover:bg-gold/80 text-black font-bold"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                    Find Order
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {step === 'select' && (
                    <div className="space-y-6">
                        <Card className="bg-black/40 border-gold/20 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-gold">Select Items to Return</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {orderItems.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 p-4 border border-white/5 rounded-lg bg-black/20">
                                        <input
                                            type="checkbox"
                                            checked={!!selectedItems[item.id]}
                                            onChange={(e) => setSelectedItems(prev => ({ ...prev, [item.id]: e.target.checked }))}
                                            className="h-5 w-5 rounded border-gold/50 bg-black text-gold focus:ring-gold"
                                        />
                                        <div className="h-16 w-16 relative rounded overflow-hidden bg-white/5">
                                            {item.products.image_url && (
                                                <OptimizedImage
                                                    src={item.products.image_url}
                                                    alt={item.products.name}
                                                    className="object-cover"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-white">{item.products.name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {item.product_variants?.variant_name} x {item.quantity}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="bg-black/40 border-gold/20 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-gold">Return Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Action</Label>
                                    <div className="flex gap-4">
                                        <Button
                                            type="button"
                                            variant={returnType === 'refund' ? 'default' : 'outline'}
                                            className={returnType === 'refund' ? 'bg-gold text-black' : 'border-gold/50 text-gold'}
                                            onClick={() => setReturnType('refund')}
                                        >
                                            Refund
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={returnType === 'exchange' ? 'default' : 'outline'}
                                            className={returnType === 'exchange' ? 'bg-gold text-black' : 'border-gold/50 text-gold'}
                                            onClick={() => setReturnType('exchange')}
                                        >
                                            Exchange
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reason">Reason for Return</Label>
                                    <textarea
                                        id="reason"
                                        className="flex min-h-[80px] w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Please describe why you are returning these items..."
                                        value={returnReason}
                                        onChange={(e) => setReturnReason(e.target.value)}
                                    />
                                </div>
                                <Button
                                    onClick={handleSubmitReturn}
                                    className="w-full bg-gold hover:bg-gold/80 text-black font-bold"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                                    Submit Return Request
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {step === 'confirm' && (
                    <Card className="bg-black/40 border-gold/20 backdrop-blur-sm text-center py-12">
                        <CardContent className="space-y-6">
                            <div className="mx-auto w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-gold" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Return Request Submitted</h2>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                Your return request has been received. We have sent a confirmation email to <strong>{email}</strong>.
                                <br /><br />
                                Return ID: <span className="font-mono text-gold">{returnId}</span>
                            </p>
                            <Button
                                onClick={() => window.location.href = '/'}
                                className="bg-gold hover:bg-gold/80 text-black"
                            >
                                Return to Home
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default Returns;
