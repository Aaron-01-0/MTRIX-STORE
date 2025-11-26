import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UGCContent {
    id: string;
    image_url: string;
    caption: string | null;
    handle: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

const UGCModeration = () => {
    const { toast } = useToast();
    const [content, setContent] = useState<UGCContent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('drop_ugc')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setContent(data || []);
        } catch (error: any) {
            console.error('Error fetching UGC:', error);
            toast({
                title: "Error",
                description: "Failed to load content",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('drop_ugc')
                .update({ status })
                .eq('id', id);

            if (error) throw error;

            toast({
                title: "Success",
                description: `Content ${status}`
            });
            fetchContent();
        } catch (error: any) {
            console.error('Error updating status:', error);
            toast({
                title: "Error",
                description: "Failed to update status",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gradient-gold">Social Proof Moderation</h2>
                <p className="text-muted-foreground">
                    Approve or reject user-generated content from drops.
                </p>
            </div>

            <div className="flex justify-end mb-4">
                <Button variant="outline" onClick={fetchContent}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : content.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No content to moderate</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {content.map((item) => (
                        <Card key={item.id} className="bg-mtrix-dark border-mtrix-gray overflow-hidden">
                            <div className="aspect-square relative">
                                <img
                                    src={item.image_url}
                                    alt={item.caption || 'UGC'}
                                    className="object-cover w-full h-full"
                                />
                                <div className="absolute top-2 right-2">
                                    <Badge variant={
                                        item.status === 'approved' ? 'default' :
                                            item.status === 'rejected' ? 'destructive' : 'secondary'
                                    }>
                                        {item.status.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-semibold text-foreground">@{item.handle || 'anonymous'}</p>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{item.caption}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                        onClick={() => updateStatus(item.id, 'approved')}
                                        disabled={item.status === 'approved'}
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        Approve
                                    </Button>
                                    <Button
                                        className="flex-1 bg-red-600 hover:bg-red-700"
                                        onClick={() => updateStatus(item.id, 'rejected')}
                                        disabled={item.status === 'rejected'}
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Reject
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UGCModeration;
