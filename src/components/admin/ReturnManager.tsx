import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Check, X, Eye } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface ReturnRequest {
    id: string;
    order_id: string;
    user_id: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    return_reason: string;
    return_type: 'refund' | 'exchange';
    items: any[];
    created_at: string;
    orders: {
        order_number: string;
    };
}

const ReturnManager = () => {
    const { toast } = useToast();
    const [returns, setReturns] = useState<ReturnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);

    useEffect(() => {
        fetchReturns();
    }, []);

    const fetchReturns = async () => {
        try {
            const { data, error } = await supabase
                .from('returns')
                .select(`
                    *,
                    orders ( order_number )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReturns(data as any);
        } catch (error: any) {
            console.error("Error fetching returns:", error);
            toast({
                title: "Error",
                description: "Failed to load returns",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('returns')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            toast({
                title: "Success",
                description: `Return request ${newStatus}`,
            });
            fetchReturns();
            setSelectedReturn(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/20 text-yellow-500';
            case 'approved': return 'bg-green-500/20 text-green-500';
            case 'rejected': return 'bg-red-500/20 text-red-500';
            case 'completed': return 'bg-blue-500/20 text-blue-500';
            default: return 'bg-gray-500/20 text-gray-500';
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gold" /></div>;

    return (
        <Card className="bg-black/40 border-gold/20 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-gold">Returns & Exchanges</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="text-gold">Order #</TableHead>
                            <TableHead className="text-gold">Type</TableHead>
                            <TableHead className="text-gold">Reason</TableHead>
                            <TableHead className="text-gold">Status</TableHead>
                            <TableHead className="text-gold">Date</TableHead>
                            <TableHead className="text-gold text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {returns.map((request) => (
                            <TableRow key={request.id} className="border-white/10 hover:bg-white/5">
                                <TableCell className="font-mono">{request.orders?.order_number}</TableCell>
                                <TableCell className="capitalize">{request.return_type}</TableCell>
                                <TableCell className="max-w-[200px] truncate" title={request.return_reason}>
                                    {request.return_reason}
                                </TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(request.status)}>
                                        {request.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedReturn(request)}
                                                className="hover:text-gold"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-zinc-900 border-gold/20 text-white">
                                            <DialogHeader>
                                                <DialogTitle>Return Details</DialogTitle>
                                            </DialogHeader>
                                            {selectedReturn && (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Order Number</p>
                                                            <p className="font-mono">{selectedReturn.orders?.order_number}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Type</p>
                                                            <p className="capitalize">{selectedReturn.return_type}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Reason</p>
                                                        <p className="bg-black/50 p-3 rounded border border-white/10 text-sm">
                                                            {selectedReturn.return_reason}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground mb-2">Items</p>
                                                        <div className="space-y-2">
                                                            {selectedReturn.items.map((item: any, idx: number) => (
                                                                <div key={idx} className="flex justify-between text-sm bg-black/30 p-2 rounded">
                                                                    <span>Product ID: {item.product_id.slice(0, 8)}...</span>
                                                                    <span>Qty: {item.quantity}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {selectedReturn.status === 'pending' && (
                                                        <div className="flex gap-3 pt-4">
                                                            <Button
                                                                className="flex-1 bg-green-600 hover:bg-green-700"
                                                                onClick={() => handleStatusUpdate(selectedReturn.id, 'approved')}
                                                            >
                                                                <Check className="mr-2 h-4 w-4" /> Approve
                                                            </Button>
                                                            <Button
                                                                className="flex-1 bg-red-600 hover:bg-red-700"
                                                                onClick={() => handleStatusUpdate(selectedReturn.id, 'rejected')}
                                                            >
                                                                <X className="mr-2 h-4 w-4" /> Reject
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        ))}
                        {returns.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No return requests found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default ReturnManager;
