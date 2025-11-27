import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface Profile {
    id: string;
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    name: string | null;
    mobile_no: string | null;
    created_at: string;
    role?: UserRole;
}

const UserManager = () => {
    const { toast } = useToast();
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingRole, setUpdatingRole] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            // Fetch profiles and roles separately since direct join might not be configured
            const [profilesRes, rolesRes] = await Promise.all([
                supabase.from('profiles').select('*').order('created_at', { ascending: false }),
                supabase.from('user_roles').select('*')
            ]);

            if (profilesRes.error) throw profilesRes.error;
            if (rolesRes.error) throw rolesRes.error;

            const rolesMap = new Map(rolesRes.data.map(r => [r.user_id, r.role]));

            const profilesWithRoles = profilesRes.data.map(profile => ({
                ...profile,
                role: rolesMap.get(profile.user_id) || 'customer'
            }));

            setUsers(profilesWithRoles);
        } catch (error: any) {
            console.error('Error fetching users:', error);
            toast({
                title: "Error",
                description: "Failed to load users",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        setUpdatingRole(userId);
        try {
            // Check if role entry exists
            const { data: existingRole } = await supabase
                .from('user_roles')
                .select('*')
                .eq('user_id', userId)
                .single();

            let error;
            if (existingRole) {
                const { error: updateError } = await supabase
                    .from('user_roles')
                    .update({ role: newRole })
                    .eq('user_id', userId);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('user_roles')
                    .insert([{ user_id: userId, role: newRole }]);
                error = insertError;
            }

            if (error) throw error;

            setUsers(users.map(u => u.user_id === userId ? { ...u, role: newRole } : u));
            toast({ title: "Success", description: "User role updated." });
        } catch (error: any) {
            console.error('Error updating role:', error);
            toast({ title: "Error", description: "Failed to update role.", variant: "destructive" });
        } finally {
            setUpdatingRole(null);
        }
    };

    const filteredUsers = users.filter(user =>
        (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.mobile_no || '').includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-orbitron font-bold text-gradient-gold">User Management</h2>
                <p className="text-muted-foreground">Manage user profiles and access roles.</p>
            </div>

            <Card className="bg-mtrix-dark border-mtrix-gray">
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-mtrix-black border-mtrix-gray"
                                />
                            </div>
                        </div>

                        <div className="rounded-md border border-mtrix-gray">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Mobile</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Joined Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8">
                                                No users found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col">
                                                        <span>{user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'}</span>
                                                        <span className="text-xs text-muted-foreground">{user.id}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{user.mobile_no || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {updatingRole === user.user_id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Select
                                                                value={user.role}
                                                                onValueChange={(val: UserRole) => handleRoleChange(user.user_id, val)}
                                                            >
                                                                <SelectTrigger className="w-[130px] h-8 bg-black/20 border-white/10">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="customer">Customer</SelectItem>
                                                                    <SelectItem value="admin">Admin</SelectItem>
                                                                    <SelectItem value="vendor">Vendor</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default UserManager;
