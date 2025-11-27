import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Search, Filter, Trash2, Copy, Check } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type MediaAsset = Tables<'media_assets'>;

interface MediaLibraryProps {
    onSelect?: (url: string) => void;
    selectMode?: boolean;
}

const MediaLibrary = ({ onSelect, selectMode = false }: MediaLibraryProps) => {
    const { toast } = useToast();
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('media_assets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAssets(data || []);
        } catch (error: any) {
            console.error('Error fetching assets:', error);
            toast({
                title: "Error",
                description: "Failed to load media library.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('product-images') // Reusing existing bucket for now
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            const type = file.type.startsWith('video/') ? 'video' : 'image';

            const { error: dbError } = await supabase
                .from('media_assets')
                .insert([{
                    url: publicUrl,
                    type: type,
                    source: 'upload',
                    tags: []
                }]);

            if (dbError) throw dbError;

            toast({ title: "Success", description: "File uploaded successfully." });
            fetchAssets();
        } catch (error: any) {
            console.error('Error uploading file:', error);
            toast({ title: "Error", description: "Upload failed.", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this asset?')) return;
        try {
            const { error } = await supabase
                .from('media_assets')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast({ title: "Success", description: "Asset deleted." });
            fetchAssets();
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
        }
    };

    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
        toast({ title: "Copied", description: "URL copied to clipboard." });
    };

    const filteredAssets = assets.filter(asset => {
        const matchesSearch = asset.url.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || asset.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-6">
            {!selectMode && (
                <div>
                    <h2 className="text-3xl font-orbitron font-bold text-gradient-gold">Media Library</h2>
                    <p className="text-muted-foreground">Centralized storage for all your brand assets.</p>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex gap-2 flex-1 w-full sm:w-auto">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search assets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-black/20 border-white/10 pl-10"
                        />
                    </div>
                    <div className="flex gap-1 bg-black/20 p-1 rounded-md border border-white/10">
                        <Button
                            variant={filterType === 'all' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilterType('all')}
                            className="h-8 px-2"
                        >
                            All
                        </Button>
                        <Button
                            variant={filterType === 'image' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilterType('image')}
                            className="h-8 px-2"
                        >
                            Images
                        </Button>
                        <Button
                            variant={filterType === 'video' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilterType('video')}
                            className="h-8 px-2"
                        >
                            Videos
                        </Button>
                    </div>
                </div>

                <div className="relative">
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept="image/*,video/*"
                        disabled={uploading}
                    />
                    <Label htmlFor="file-upload">
                        <Button variant="outline" className="cursor-pointer bg-gradient-gold text-mtrix-black hover:shadow-gold" asChild disabled={uploading}>
                            <span>
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                Upload Asset
                            </span>
                        </Button>
                    </Label>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredAssets.map((asset) => (
                        <div key={asset.id} className="group relative aspect-square bg-black/40 rounded-lg border border-white/10 overflow-hidden hover:border-primary/50 transition-all">
                            {asset.type === 'image' ? (
                                <img src={asset.url} alt="Asset" className="w-full h-full object-cover" />
                            ) : (
                                <video src={asset.url} className="w-full h-full object-cover" />
                            )}

                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                {selectMode ? (
                                    <Button size="sm" onClick={() => onSelect?.(asset.url)} className="bg-primary text-black">
                                        Select
                                    </Button>
                                ) : (
                                    <>
                                        <Button size="icon" variant="secondary" onClick={() => copyToClipboard(asset.url)}>
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="destructive" onClick={() => handleDelete(asset.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </>
                                )}
                            </div>

                            <div className="absolute bottom-2 right-2">
                                <Badge variant="secondary" className="text-[10px] bg-black/80 backdrop-blur-sm">
                                    {asset.type}
                                </Badge>
                            </div>
                        </div>
                    ))}
                    {filteredAssets.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground">
                            No assets found. Upload some to get started.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MediaLibrary;
