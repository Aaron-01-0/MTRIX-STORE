import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ArenaDesign, VotingPeriod } from '@/types/arena';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Eye, Calendar, Trophy } from 'lucide-react';

const DesignManager = () => {
  const { toast } = useToast();
  const [designs, setDesigns] = useState<ArenaDesign[]>([]);
  const [periods, setPeriods] = useState<VotingPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('submitted');

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Periods
      const { data: periodsData } = await supabase
        .from('voting_periods')
        .select('*')
        .order('created_at', { ascending: false });
      setPeriods((periodsData as VotingPeriod[]) || []);

      // Fetch Designs
      let query = supabase
        .from('arena_designs')
        .select(`
          *,
          profiles:user_id (username, email)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (selectedPeriod !== 'all') {
        query = query.eq('voting_period_id', selectedPeriod);
      }

      const { data: designsData, error } = await query;
      if (error) throw error;
      setDesigns((designsData as any[]) || []);

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, periodId?: string) => {
    try {
      const updateData: any = { status };
      if (periodId) updateData.voting_period_id = periodId;

      const { error } = await supabase
        .from('arena_designs')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Success", description: `Design ${status}` });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const finalizeWinners = async (periodId: string) => {
    if (!confirm('Are you sure? This will end the voting period and generate coupons for the top 3 winners.')) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-arena-coupons', {
        body: { voting_period_id: periodId }
      });

      if (error) throw error;

      toast({
        title: "Winners Finalized!",
        description: data.message
      });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Arena Design Moderation</h2>
        <div className="flex gap-4">
          {selectedPeriod !== 'all' && periods.find(p => p.id === selectedPeriod)?.status === 'active' && (
            <Button
              onClick={() => finalizeWinners(selectedPeriod)}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Finalize Winners & Send Rewards
            </Button>
          )}
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Periods</SelectItem>
              {periods.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title} ({p.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="submitted">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="voting">In Voting</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-mtrix-dark border-mtrix-gray">
        <CardHeader>
          <CardTitle>Submissions Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {designs.map((design) => (
                <TableRow key={design.id}>
                  <TableCell>
                    <div className="w-16 h-20 rounded overflow-hidden bg-gray-800">
                      <img src={design.image_url} alt={design.title} className="w-full h-full object-cover" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{design.title}</TableCell>
                  <TableCell>{design.profiles?.username || 'Unknown'}</TableCell>
                  <TableCell><Badge variant="outline">{design.category}</Badge></TableCell>
                  <TableCell>
                    <Badge className={
                      design.status === 'submitted' ? 'bg-yellow-500/20 text-yellow-500' :
                        design.status === 'voting' ? 'bg-green-500/20 text-green-500' :
                          design.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                            'bg-gray-500/20 text-gray-500'
                    }>
                      {design.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline"><Eye className="w-4 h-4" /></Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl bg-black border-gray-800">
                          <DialogHeader>
                            <DialogTitle>{design.title}</DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <img src={design.image_url} className="w-full rounded-lg" />
                              <p className="mt-2 text-sm text-gray-400">Main Asset</p>
                            </div>
                            {design.mockup_url && (
                              <div>
                                <img src={design.mockup_url} className="w-full rounded-lg" />
                                <p className="mt-2 text-sm text-gray-400">Mockup</p>
                              </div>
                            )}
                          </div>
                          <div className="mt-4">
                            <p className="text-gray-300">{design.description}</p>
                            <div className="mt-2 flex gap-2">
                              {design.tags?.map(tag => (
                                <Badge key={tag} variant="secondary">#{tag}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-end gap-4 mt-6">
                            {design.status === 'submitted' && (
                              <>
                                <Button
                                  variant="destructive"
                                  onClick={() => updateStatus(design.id, 'rejected')}
                                >
                                  Reject
                                </Button>
                                <Button
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => updateStatus(design.id, 'voting', periods[0]?.id)}
                                >
                                  Approve & Add to Active Period
                                </Button>
                              </>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesignManager;
