import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DropProductManager from './drop/DropProductManager';

interface Drop {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    hero_image_url: string | null;
    video_url: string | null;
    status: 'draft' | 'scheduled' | 'live' | 'ended';
    launch_at: string | null;
    end_at: string | null;
}

const DropManager = () => {
    const { toast } = useToast();
    const [drops, setDrops] = useState<Drop[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Drop>>({});

    useEffect(() => {
        fetchDrops();
    }, []);

    const fetchDrops = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('drops')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDrops(data || []);
        } catch (error: any) {
            console.error('Error fetching drops:', error);
            toast({
                title: "Error",
                description: "Failed to load drops",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (!formData.title || !formData.slug) {
                toast({
                    title: "Error",
                    description: "Title and Slug are required",
                    variant: "destructive"
                });
                return;
            }

            if (editingId === 'new') {
                const { error } = await supabase
                    .from('drops')
                    .insert([formData]);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('drops')
                    .update(formData)
                    .eq('id', editingId);
                if (error) throw error;
            }

            toast({
                title: "Success",
                description: "Drop saved successfully"
            });
            setEditingId(null);
            setFormData({});
            fetchDrops();
        } catch (error: any) {
            console.error('Error saving drop:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to save drop",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this drop?')) return;

        try {
            const { error } = await supabase
                .from('drops')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast({
                title: "Success",
                description: "Drop deleted successfully"
            });
            fetchDrops();
        } catch (error: any) {
            console.error('Error deleting drop:', error);
            toast({
                title: "Error",
                description: "Failed to delete drop",
                variant: "destructive"
            });
        }
    };

    const startEdit = (drop: Drop) => {
        setEditingId(drop.id);
        setFormData(drop);
    };

    const startNew = () => {
        setEditingId('new');
        setFormData({
            status: 'draft',
            title: '',
            slug: '',
            description: '',
            hero_image_url: '',
            video_url: '',
            launch_at: null,
            end_at: null
        });
    };

    return (
        <Card className="bg-mtrix-dark border-mtrix-gray">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-gradient-gold">Limited Drops Management</CardTitle>
                <Button onClick={startNew} className="bg-primary text-mtrix-black hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Drop
                </Button>
            </CardHeader>
            <CardContent>
                {editingId && (
                    <div className="mb-8 p-4 border border-mtrix-gray rounded-lg bg-mtrix-black/50">
                        <h3 className="text-lg font-semibold mb-4 text-foreground">
                            {editingId === 'new' ? 'New Drop' : 'Edit Drop'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Title *</Label>
                                <Input
                                    value={formData.title || ''}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="bg-mtrix-black border-mtrix-gray"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Slug *</Label>
                                <Input
                                    value={formData.slug || ''}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="bg-mtrix-black border-mtrix-gray"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="bg-mtrix-black border-mtrix-gray"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Hero Image URL</Label>
                                <Input
                                    value={formData.hero_image_url || ''}
                                    onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                                    className="bg-mtrix-black border-mtrix-gray"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Video URL</Label>
                                <Input
                                    value={formData.video_url || ''}
                                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                    className="bg-mtrix-black border-mtrix-gray"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Launch Date</Label>
                                <Input
                                    type="datetime-local"
                                    value={formData.launch_at ? new Date(formData.launch_at).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => setFormData({ ...formData, launch_at: new Date(e.target.value).toISOString() })}
                                    className="bg-mtrix-black border-mtrix-gray"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input
                                    type="datetime-local"
                                    value={formData.end_at ? new Date(formData.end_at).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => setFormData({ ...formData, end_at: new Date(e.target.value).toISOString() })}
                                    className="bg-mtrix-black border-mtrix-gray"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                                >
                                    <SelectTrigger className="bg-mtrix-black border-mtrix-gray">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="live">Live</SelectItem>
                                        <SelectItem value="ended">Ended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {editingId !== 'new' && (
                            <div className="mt-8 pt-8 border-t border-mtrix-gray">
                                <DropProductManager dropId={editingId} />
                            </div>
                        )}

                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="ghost" onClick={() => setEditingId(null)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} className="bg-primary text-mtrix-black">
                                Save Drop
                            </Button>
                        </div>
                    </div>
                )}

                <div className="rounded-md border border-mtrix-gray">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Launch Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                                </TableRow>
                            ) : drops.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">No drops found</TableCell>
                                </TableRow>
                            ) : (
                                drops.map((drop) => (
                                    <TableRow key={drop.id}>
                                        <TableCell className="font-medium">{drop.title}</TableCell>
                                        <TableCell>{drop.slug}</TableCell>
                                        <TableCell>{drop.launch_at ? new Date(drop.launch_at).toLocaleDateString() : 'TBA'}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${drop.status === 'live' ? 'bg-green-500/20 text-green-400' :
                                                drop.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                                                    drop.status === 'ended' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {drop.status.toUpperCase()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => startEdit(drop)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(drop.id)} className="text-red-400 hover:text-red-300">
                                                <Trash2 className="w-4 h-4" />
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
    );
};

export default DropManager;
