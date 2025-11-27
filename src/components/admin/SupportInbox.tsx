import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Search, CheckCircle, Clock, Archive, Trash2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ContactMessage {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    subject: string;
    message: string;
    status: string | null;
    created_at: string;
}

const SupportInbox = () => {
    const { toast } = useToast();
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('contact_messages')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMessages(data || []);
        } catch (error: any) {
            console.error('Error fetching messages:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch messages',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('contact_messages')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setMessages(messages.map(msg =>
                msg.id === id ? { ...msg, status: newStatus } : msg
            ));

            toast({
                title: 'Status Updated',
                description: `Message marked as ${newStatus}`,
            });

            if (selectedMessage?.id === id) {
                setSelectedMessage(prev => prev ? { ...prev, status: newStatus } : null);
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: 'Failed to update status',
                variant: 'destructive'
            });
        }
    };

    const deleteMessage = async (id: string) => {
        if (!confirm('Are you sure you want to delete this message?')) return;

        try {
            const { error } = await supabase
                .from('contact_messages')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setMessages(messages.filter(msg => msg.id !== id));
            setSelectedMessage(null);
            toast({
                title: 'Deleted',
                description: 'Message deleted successfully',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: 'Failed to delete message',
                variant: 'destructive'
            });
        }
    };

    const filteredMessages = messages.filter(msg => {
        const matchesSearch =
            msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.last_name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || (msg.status || 'new') === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string | null) => {
        const s = status || 'new';
        switch (s) {
            case 'new': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">New</Badge>;
            case 'read': return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Read</Badge>;
            case 'replied': return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Replied</Badge>;
            case 'archived': return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">Archived</Badge>;
            default: return <Badge variant="outline">{s}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-mtrix-black border-mtrix-gray"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px] bg-mtrix-black border-mtrix-gray">
                            <SelectValue placeholder="Filter Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="read">Read</SelectItem>
                            <SelectItem value="replied">Replied</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchMessages} title="Refresh">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <Card className="bg-mtrix-dark border-mtrix-gray overflow-hidden">
                <div className="rounded-md">
                    <Table>
                        <TableHeader className="bg-black/40">
                            <TableRow className="border-mtrix-gray hover:bg-transparent">
                                <TableHead className="text-gold">Status</TableHead>
                                <TableHead className="text-gold">Sender</TableHead>
                                <TableHead className="text-gold">Subject</TableHead>
                                <TableHead className="text-gold">Date</TableHead>
                                <TableHead className="text-right text-gold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Loading messages...
                                    </TableCell>
                                </TableRow>
                            ) : filteredMessages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No messages found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredMessages.map((msg) => (
                                    <TableRow key={msg.id} className="border-mtrix-gray/50 hover:bg-white/5 transition-colors">
                                        <TableCell>{getStatusBadge(msg.status)}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-white">{msg.first_name} {msg.last_name}</span>
                                                <span className="text-xs text-muted-foreground">{msg.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={msg.subject}>
                                            {msg.subject}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedMessage(msg);
                                                            if (!msg.status || msg.status === 'new') {
                                                                updateStatus(msg.id, 'read');
                                                            }
                                                        }}
                                                    >
                                                        View
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-mtrix-dark border-mtrix-gray max-w-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-gradient-gold text-xl flex items-center gap-2">
                                                            <Mail className="w-5 h-5" /> Message Details
                                                        </DialogTitle>
                                                    </DialogHeader>

                                                    {selectedMessage && (
                                                        <div className="space-y-6 mt-4">
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div>
                                                                    <label className="text-muted-foreground block mb-1">From</label>
                                                                    <div className="text-white font-medium">{selectedMessage.first_name} {selectedMessage.last_name}</div>
                                                                    <div className="text-primary">{selectedMessage.email}</div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <label className="text-muted-foreground block mb-1">Received</label>
                                                                    <div className="text-white">{new Date(selectedMessage.created_at).toLocaleString()}</div>
                                                                    <div className="mt-1">{getStatusBadge(selectedMessage.status)}</div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-black/30 p-4 rounded-lg border border-white/10">
                                                                <label className="text-muted-foreground block mb-2 text-xs uppercase tracking-wider">Subject</label>
                                                                <h4 className="text-lg font-medium text-white mb-4">{selectedMessage.subject}</h4>
                                                                <label className="text-muted-foreground block mb-2 text-xs uppercase tracking-wider">Message</label>
                                                                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                                                    {selectedMessage.message}
                                                                </p>
                                                            </div>

                                                            <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => deleteMessage(selectedMessage.id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                                </Button>

                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => updateStatus(selectedMessage.id, 'new')}
                                                                        disabled={selectedMessage.status === 'new'}
                                                                    >
                                                                        Mark Unread
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => updateStatus(selectedMessage.id, 'replied')}
                                                                        className="border-green-500/50 text-green-500 hover:bg-green-500/10"
                                                                        disabled={selectedMessage.status === 'replied'}
                                                                    >
                                                                        <CheckCircle className="w-4 h-4 mr-2" /> Mark Replied
                                                                    </Button>
                                                                    <Button
                                                                        variant="default"
                                                                        size="sm"
                                                                        className="bg-gradient-gold text-mtrix-black"
                                                                        onClick={() => window.location.href = `mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                                                                    >
                                                                        <Mail className="w-4 h-4 mr-2" /> Reply via Email
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};

export default SupportInbox;
