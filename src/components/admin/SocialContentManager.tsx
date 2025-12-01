import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialContent {
    id: string;
    platform: 'instagram_post' | 'instagram_reel';
    url: string;
    video_url: string | null;
    thumbnail_url: string | null;
    caption: string | null;
    display_order: number;
    is_active: boolean;
}

const SocialContentManager = () => {
    const { toast } = useToast();
    const [content, setContent] = useState<SocialContent[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<SocialContent>>({});

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('social_content' as any)
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setContent((data as any) || []);
        } catch (error: any) {
            console.error('Error fetching social content:', error);
            toast({
                title: "Error",
                description: "Failed to load social content",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (editingId === 'new') {
                const { error } = await supabase
                    .from('social_content' as any)
                    .insert([formData]);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('social_content' as any)
                    .update(formData)
                    .eq('id', editingId);
                if (error) throw error;
            }

            toast({
                title: "Success",
                description: "Content saved successfully"
            });
            setEditingId(null);
            setFormData({});
            fetchContent();
        } catch (error: any) {
            console.error('Error saving content:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to save content",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this content?')) return;

        try {
            const { error } = await supabase
                .from('social_content' as any)
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast({
                title: "Success",
                description: "Content deleted successfully"
            });
            fetchContent();
        } catch (error: any) {
            console.error('Error deleting content:', error);
            toast({
                title: "Error",
                description: "Failed to delete content",
                variant: "destructive"
            });
        }
    };

    const startEdit = (item: SocialContent) => {
        setEditingId(item.id);
        setFormData(item);
    };

    const startNew = () => {
        setEditingId('new');
        setFormData({
            is_active: true,
            platform: 'instagram_post',
            display_order: 0,
            url: '',
            video_url: '',
            thumbnail_url: '',
            caption: ''
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-orbitron font-bold text-gradient-gold">Social Media</h2>
                    <p className="text-muted-foreground">Manage your social feed content.</p>
                </div>
                <Button onClick={startNew} className="bg-gradient-gold text-mtrix-black hover:shadow-gold">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Content
                </Button>
            </div>

            <Card className="bg-mtrix-dark border-mtrix-gray">
                <CardContent className="p-6">
                    {editingId && (
                        <div className="mb-8 p-4 border border-mtrix-gray rounded-lg bg-mtrix-black/50">
                            <h3 className="text-lg font-semibold mb-4 text-foreground">
                                {editingId === 'new' ? 'New Content' : 'Edit Content'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Platform</Label>
                                    <Select
                                        value={formData.platform}
                                        onValueChange={(value: any) => setFormData({ ...formData, platform: value })}
                                    >
                                        <SelectTrigger className="bg-mtrix-black border-mtrix-gray">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="instagram_post">Instagram Post</SelectItem>
                                            <SelectItem value="instagram_reel">Instagram Reel</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Display Order</Label>
                                    <Input
                                        type="number"
                                        value={formData.display_order || 0}
                                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                                        className="bg-mtrix-black border-mtrix-gray"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Post URL</Label>
                                    <Input
                                        value={formData.url || ''}
                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                        className="bg-mtrix-black border-mtrix-gray"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Thumbnail URL</Label>
                                    <Input
                                        value={formData.thumbnail_url || ''}
                                        onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                                        className="bg-mtrix-black border-mtrix-gray"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Video URL (Optional - for hover effect)</Label>
                                    <Input
                                        value={formData.video_url || ''}
                                        onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                        className="bg-mtrix-black border-mtrix-gray"
                                        placeholder="https://.../video.mp4"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Caption</Label>
                                    <Textarea
                                        value={formData.caption || ''}
                                        onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                                        className="bg-mtrix-black border-mtrix-gray"
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                    />
                                    <Label>Active</Label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="ghost" onClick={() => setEditingId(null)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} className="bg-gradient-gold text-mtrix-black">
                                    Save Content
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="rounded-md border border-mtrix-gray">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Platform</TableHead>
                                    <TableHead>Caption</TableHead>
                                    <TableHead>Order</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                                    </TableRow>
                                ) : content.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">No content found</TableCell>
                                    </TableRow>
                                ) : (
                                    content.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="capitalize">{item.platform.replace('_', ' ')}</TableCell>
                                            <TableCell className="max-w-xs truncate">{item.caption || 'No caption'}</TableCell>
                                            <TableCell>{item.display_order}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs ${item.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {item.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => startEdit(item)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300">
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
        </div>
    );
};

export default SocialContentManager;
