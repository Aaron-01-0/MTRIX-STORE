import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  RefreshCw,
  Loader2,
  MoreHorizontal,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  Undo2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';

interface PaymentTransaction {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  payment_method?: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  created_at: string;
  updated_at: string;
}

const PaymentManager = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [processingRefund, setProcessingRefund] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPayments(data || []);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch payments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('payment_transactions')
        .update({ status: newStatus })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Payment status updated successfully',
      });

      fetchPayments();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment status',
        variant: 'destructive',
      });
    }
  };

  const fetchFromRazorpay = async (payment: PaymentTransaction) => {
    if (!payment.razorpay_payment_id) {
      toast({
        title: 'Error',
        description: 'No Razorpay payment ID found',
        variant: 'destructive',
      });
      return;
    }

    setRefreshing(payment.id);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-razorpay-payment', {
        body: { razorpay_payment_id: payment.razorpay_payment_id },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Payment data refreshed from Razorpay',
        });
        fetchPayments();
      }
    } catch (error) {
      console.error('Error fetching from Razorpay:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch payment data from Razorpay',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(null);
    }
  };

  const handleRefund = async (payment: PaymentTransaction) => {
    if (!payment.razorpay_payment_id) return;

    if (!confirm('Are you sure you want to refund this payment? This action cannot be undone.')) return;

    setProcessingRefund(payment.id);
    try {
      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: {
          payment_id: payment.razorpay_payment_id,
          amount: payment.amount
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Refund processed successfully',
        });
        fetchPayments();
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
      setProcessingRefund(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'captured': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'authorized': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'created': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'failed': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'refunded': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const filteredPayments = payments.filter(
    (payment) => {
      const matchesSearch =
        (payment.razorpay_payment_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.razorpay_order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.order_id?.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

      return matchesSearch && matchesStatus;
    }
  );

  const totalPages = Math.ceil(filteredPayments.length / pageSize);
  const paginatedPayments = filteredPayments.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-mtrix-dark/50 backdrop-blur-sm p-4 rounded-xl border border-mtrix-gray shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search payment ID..."
              className="pl-9 bg-mtrix-black border-mtrix-gray focus:border-mtrix-gold text-white transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-mtrix-black border-mtrix-gray text-white">
              <div className="flex items-center gap-2 text-gray-300">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-mtrix-dark border-mtrix-gray text-white">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="captured">Captured</SelectItem>
              <SelectItem value="authorized">Authorized</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" className="bg-mtrix-black border-mtrix-gray hover:bg-mtrix-gray text-white" onClick={fetchPayments}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="bg-mtrix-dark/50 backdrop-blur-sm rounded-xl border border-mtrix-gray shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-mtrix-black/50 hover:bg-mtrix-black/50 border-mtrix-gray">
              <TableHead className="font-semibold text-gray-400">Order ID</TableHead>
              <TableHead className="font-semibold text-gray-400">Amount</TableHead>
              <TableHead className="font-semibold text-gray-400">Status</TableHead>
              <TableHead className="font-semibold text-gray-400">Method</TableHead>
              <TableHead className="font-semibold text-gray-400">Razorpay ID</TableHead>
              <TableHead className="font-semibold text-gray-400">Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-mtrix-gray">
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col justify-center items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-mtrix-gold" />
                    <span className="text-sm text-gray-400">Loading payments...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedPayments.length === 0 ? (
              <TableRow className="border-mtrix-gray">
                <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                  No payments found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedPayments.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-mtrix-gray/20 transition-colors duration-200 border-mtrix-gray">
                  <TableCell className="font-mono text-xs text-gray-400">
                    {payment.order_id?.substring(0, 8)}...
                  </TableCell>
                  <TableCell className="font-medium text-mtrix-gold">
                    {payment.currency} {payment.amount}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`capitalize font-normal border ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300 capitalize">
                    {payment.payment_method || payment.payment_type || '-'}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-gray-500">
                    {payment.razorpay_payment_id || '-'}
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {format(new Date(payment.created_at), 'MMM d, HH:mm')}
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
                        <DropdownMenuItem
                          onClick={() => fetchFromRazorpay(payment)}
                          disabled={refreshing === payment.id || !payment.razorpay_payment_id}
                          className="cursor-pointer hover:bg-mtrix-gray/50 focus:bg-mtrix-gray/50"
                        >
                          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing === payment.id ? 'animate-spin' : ''}`} />
                          Sync Status
                        </DropdownMenuItem>
                        {payment.status === 'captured' && (
                          <DropdownMenuItem
                            onClick={() => handleRefund(payment)}
                            disabled={processingRefund === payment.id}
                            className="cursor-pointer hover:bg-mtrix-gray/50 focus:bg-mtrix-gray/50 text-rose-400 focus:text-rose-400"
                          >
                            <Undo2 className={`mr-2 h-4 w-4 ${processingRefund === payment.id ? 'animate-spin' : ''}`} />
                            Refund
                          </DropdownMenuItem>
                        )}
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
          Page {page} of {totalPages || 1}
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
            disabled={page === totalPages || totalPages === 0}
            className="bg-mtrix-black border-mtrix-gray hover:bg-mtrix-gray text-white disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentManager;
