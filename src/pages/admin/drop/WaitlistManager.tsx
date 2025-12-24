import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WaitlistEntry {
    id: string;
    email: string;
    status: 'pending' | 'notified' | 'purchased';
    created_at: string;
    drops: {
        title: string;
    } | null;
}

interface DropOption {
    id: string;
    title: string;
}

const WaitlistManager = () => {
    const { toast } = useToast();
    const [entries, setEntries] = useState<WaitlistEntry[]>([]);
    const [drops, setDrops] = useState<DropOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDrop, setSelectedDrop] = useState<string>('all');

    useEffect(() => {
        fetchDrops();
        fetchWaitlist();
    }, []);

    useEffect(() => {
        fetchWaitlist();
    }, [selectedDrop]);

    const fetchDrops = async () => {
        const { data } = await supabase.from('drops').select('id, title');
        if (data) setDrops(data);
    };

    const fetchWaitlist = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('drop_waitlist')
                .select(`
                    *,
                    drops (
                        title
                    )
                `)
                .order('created_at', { ascending: false });

            if (selectedDrop !== 'all') {
                query = query.eq('drop_id', selectedDrop);
            }

            const { data, error } = await query;

            if (error) throw error;
            setEntries((data as unknown as WaitlistEntry[]) || []);
        } catch (error: any) {
            console.error('Error fetching waitlist:', error);
            toast({
                title: "Error",
                description: "Failed to load waitlist",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleNotify = async (id: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase.functions.invoke('send-waitlist-notification', {
                body: { waitlistId: id }
            });

            if (error) throw error;

            toast({
                title: "Notification Sent",
                description: "User has been notified about the drop.",
            });

            // Update local state or refetch
            setEntries(entries.map(e => e.id === id ? { ...e, status: 'notified' } : e));
        } catch (error: any) {
            console.error('Notification failed:', error);
            toast({
                title: "Error",
                description: "Failed to send notification: " + error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gradient-gold">Waitlist Management</h2>
                <p className="text-muted-foreground">
                    View and manage users waiting for drops.
                </p>
            </div>

            <Card className="bg-mtrix-dark border-mtrix-gray">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Waitlist Entries</CardTitle>
                    <div className="flex items-center gap-4">
                        <Select value={selectedDrop} onValueChange={setSelectedDrop}>
                            <SelectTrigger className="w-[200px] bg-mtrix-black border-mtrix-gray">
                                <SelectValue placeholder="Filter by Drop" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Drops</SelectItem>
                                {drops.map(drop => (
                                    <SelectItem key={drop.id} value={drop.id}>{drop.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={fetchWaitlist}>
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-mtrix-gray">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Drop</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                                    </TableRow>
                                ) : entries.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">No waitlist entries found</TableCell>
                                    </TableRow>
                                ) : (
                                    entries.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell className="font-medium">{entry.email}</TableCell>
                                            <TableCell>{entry.drops?.title || 'Unknown Drop'}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    entry.status === 'purchased' ? 'default' :
                                                        entry.status === 'notified' ? 'secondary' : 'outline'
                                                }>
                                                    {entry.status?.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleNotify(entry.id)}
                                                    disabled={entry.status !== 'pending'}
                                                >
                                                    <Mail className="w-4 h-4 mr-2" />
                                                    Notify
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default WaitlistManager;
