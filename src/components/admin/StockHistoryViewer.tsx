import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface StockHistoryViewerProps {
    variantId: string | null;
    isOpen: boolean;
    onClose: () => void;
    variantName?: string;
}

interface InventoryLog {
    id: string;
    created_at: string;
    action_type: string;
    quantity_change: number;
    description: string;
}

const StockHistoryViewer: React.FC<StockHistoryViewerProps> = ({
    variantId,
    isOpen,
    onClose,
    variantName
}) => {
    const [logs, setLogs] = useState<InventoryLog[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && variantId) {
            fetchLogs();
        }
    }, [isOpen, variantId]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('inventory_history')
                .select('*')
                .eq('variant_id', variantId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching inventory logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionBadge = (type: string, change: number) => {
        switch (type) {
            case 'initial_stock':
                return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Initial</Badge>;
            case 'restock':
                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Restock</Badge>;
            case 'deduction':
                return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Deduction</Badge>;
            case 'order':
                return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Order</Badge>;
            default:
                // Fallback based on change
                return change > 0
                    ? <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Adjustment (+)</Badge>
                    : <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Adjustment (-)</Badge>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl bg-black/90 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Stock History: {variantName || 'Variant'}</DialogTitle>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">
                            No history found for this variant.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/10 hover:bg-white/5">
                                    <TableHead className="text-gray-400">Date</TableHead>
                                    <TableHead className="text-gray-400">Action</TableHead>
                                    <TableHead className="text-gray-400 text-right">Change</TableHead>
                                    <TableHead className="text-gray-400">Description</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id} className="border-white/10 hover:bg-white/5">
                                        <TableCell className="font-mono text-sm">
                                            {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell>{getActionBadge(log.action_type, log.quantity_change)}</TableCell>
                                        <TableCell className={`text-right font-bold ${log.quantity_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{log.description}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default StockHistoryViewer;
