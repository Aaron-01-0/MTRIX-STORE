import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, ShieldAlert, Terminal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LogEntry {
    id: string;
    user_id: string;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    details: any;
    created_at: string;
    profiles?: {
        email: string;
        name: string;
        avatar_url: string | null;
    };
}

const ActivityLogs = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterAction, setFilterAction] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, [filterAction]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('activity_logs')
                .select(`
                    *,
                    profiles:user_id (email, name, avatar_url)
                `)
                .order('created_at', { ascending: false })
                .limit(100);

            if (filterAction !== 'all') {
                query = query.eq('action', filterAction);
            }

            const { data, error } = await query;

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            log.action.toLowerCase().includes(searchLower) ||
            log.profiles?.email?.toLowerCase().includes(searchLower) ||
            log.profiles?.name?.toLowerCase().includes(searchLower) ||
            JSON.stringify(log.details).toLowerCase().includes(searchLower)
        );
    });

    const uniqueActions = Array.from(new Set(logs.map(log => log.action)));

    return (
        <div className="min-h-screen bg-black text-white font-inter selection:bg-gold/30">
            <Navbar />

            <div className="container mx-auto px-4 py-24">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <ShieldAlert className="text-gold" />
                            System Logs
                        </h1>
                        <p className="text-gray-400 mt-1">Audit trail of all system activities</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <Input
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-white/5 border-white/10 w-full sm:w-64"
                            />
                        </div>

                        <Select value={filterAction} onValueChange={setFilterAction}>
                            <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10">
                                <SelectValue placeholder="Filter Action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                {uniqueActions.map(action => (
                                    <SelectItem key={action} value={action}>{action}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button onClick={fetchLogs} variant="outline" className="border-white/10 hover:bg-white/5">
                            Refresh
                        </Button>
                    </div>
                </div>

                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-white/5">
                            <TableRow className="border-white/10 hover:bg-transparent">
                                <TableHead className="text-gray-400">Timestamp</TableHead>
                                <TableHead className="text-gray-400">User</TableHead>
                                <TableHead className="text-gray-400">Action</TableHead>
                                <TableHead className="text-gray-400">Entity</TableHead>
                                <TableHead className="text-gray-400">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                        No logs found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => (
                                    <TableRow key={log.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                        <TableCell className="font-mono text-xs text-gray-400">
                                            {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={log.profiles?.avatar_url || ''} alt={log.profiles?.name || ''} />
                                                    <AvatarFallback className="bg-zinc-800 text-gold text-xs">
                                                        {log.profiles?.name?.charAt(0).toUpperCase() || '?'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{log.profiles?.name || 'Unknown'}</span>
                                                    <span className="text-xs text-gray-500">{log.profiles?.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${log.action.includes('DELETE') ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                log.action.includes('UPDATE') ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    log.action.includes('CREATE') ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {log.entity_type && (
                                                <div className="flex items-center gap-1 text-xs text-gray-300">
                                                    <span className="opacity-50">{log.entity_type}:</span>
                                                    <span className="font-mono">{log.entity_id?.substring(0, 8)}...</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-xs truncate text-xs font-mono text-gray-500" title={JSON.stringify(log.details, null, 2)}>
                                                {JSON.stringify(log.details)}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ActivityLogs;
