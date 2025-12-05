import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, RefreshCw, Type, Palette, Image as ImageIcon } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import html2canvas from 'html2canvas';

type Product = Tables<'products'> & {
    product_images: { image_url: string; is_main: boolean }[] | null;
};
type BrandSettings = Tables<'brand_settings'>;

const TEMPLATES = [
    { id: 'minimal', name: 'Minimal Drop', aspect: '1/1' },
    { id: 'bold', name: 'Bold Sale', aspect: '4/5' },
    { id: 'story', name: 'Story Launch', aspect: '9/16' },
];

const CampaignBuilder = () => {
    const { toast } = useToast();
    const canvasRef = useRef<HTMLDivElement>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [brand, setBrand] = useState<BrandSettings | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [template, setTemplate] = useState(TEMPLATES[0]);
    const [customText, setCustomText] = useState('');
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [productsRes, brandRes] = await Promise.all([
                supabase.from('products').select('*, product_images(image_url, is_main)').eq('status', 'published').order('created_at', { ascending: false }),
                supabase.from('brand_settings').select('*').single()
            ]);

            if (productsRes.error) throw productsRes.error;
            setProducts(productsRes.data || []);
            if (brandRes.data) setBrand(brandRes.data);
        } catch (error) {
            console.error('Error loading data:', error);
            toast({ title: "Error", description: "Failed to load data.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!canvasRef.current) return;
        setGenerating(true);
        try {
            const canvas = await html2canvas(canvasRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: null
            });

            const link = document.createElement('a');
            link.download = `campaign-${selectedProduct?.sku}-${template.id}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            toast({ title: "Success", description: "Image downloaded successfully." });
        } catch (error) {
            console.error('Error generating image:', error);
            toast({ title: "Error", description: "Failed to generate image.", variant: "destructive" });
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Styles based on brand kit
    const primaryColor = brand?.primary_color || '#000000';
    const secondaryColor = brand?.secondary_color || '#ffffff';
    const accentColor = brand?.accent_color || '#ffd700';
    const fontHeading = brand?.font_heading || 'Inter';
    const fontBody = brand?.font_body || 'Inter';

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-orbitron font-bold text-gradient-gold">Campaign Builder</h2>
                <p className="text-muted-foreground">Generate on-brand social media assets in seconds.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="space-y-6">
                    <Card className="bg-mtrix-dark border-mtrix-gray">
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label>1. Select Product</Label>
                                <Select onValueChange={(val) => {
                                    const p = products.find(p => p.id === val);
                                    setSelectedProduct(p || null);
                                    setCustomText(p ? `NEW DROP: ${p.name}` : '');
                                }}>
                                    <SelectTrigger className="bg-black/20 border-white/10">
                                        <SelectValue placeholder="Choose a product..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>2. Select Template</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {TEMPLATES.map(t => (
                                        <Button
                                            key={t.id}
                                            variant={template.id === t.id ? 'default' : 'outline'}
                                            className={template.id === t.id ? 'bg-primary text-black' : 'bg-transparent'}
                                            onClick={() => setTemplate(t)}
                                        >
                                            {t.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>3. Customize Text</Label>
                                <Input
                                    value={customText}
                                    onChange={(e) => setCustomText(e.target.value)}
                                    className="bg-black/20 border-white/10"
                                    placeholder="Overlay text..."
                                />
                            </div>

                            <Button
                                onClick={handleDownload}
                                disabled={!selectedProduct || generating}
                                className="w-full bg-gradient-gold text-mtrix-black hover:shadow-gold mt-4"
                            >
                                {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                                Generate & Download
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Preview Canvas */}
                <div className="lg:col-span-2 flex items-center justify-center bg-black/40 rounded-xl border border-white/10 p-8 overflow-hidden">
                    {selectedProduct ? (
                        <div
                            ref={canvasRef}
                            className="relative bg-white overflow-hidden shadow-2xl transition-all duration-500"
                            style={{
                                width: '500px',
                                aspectRatio: template.aspect.replace('/', ' / '),
                                backgroundColor: secondaryColor,
                                color: primaryColor,
                                fontFamily: fontBody
                            }}
                        >
                            {/* Template: Minimal */}
                            {template.id === 'minimal' && (
                                <div className="w-full h-full flex flex-col p-8">
                                    <div className="flex-1 relative rounded-lg overflow-hidden mb-6">
                                        {/* Placeholder for product image - using a generic one if no specific image logic yet */}
                                        {selectedProduct.product_images && selectedProduct.product_images.length > 0 ? (
                                            <img
                                                src={selectedProduct.product_images.find(img => img.is_main)?.image_url || selectedProduct.product_images[0].image_url}
                                                alt={selectedProduct.name}
                                                className="w-full h-full object-cover"
                                                crossOrigin="anonymous"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                <ImageIcon className="w-16 h-16" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                                            New Arrival
                                        </div>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h2 className="text-3xl font-bold uppercase tracking-tight" style={{ fontFamily: fontHeading }}>
                                            {selectedProduct.name}
                                        </h2>
                                        <p className="text-xl font-medium opacity-80">{customText}</p>
                                        <div className="inline-block px-6 py-2 mt-2 rounded-full text-white font-bold" style={{ backgroundColor: accentColor, color: primaryColor }}>
                                            Shop Now
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Template: Bold */}
                            {template.id === 'bold' && (
                                <div className="w-full h-full relative">
                                    <div className="absolute inset-0 bg-gray-200">
                                        {/* Placeholder Image */}
                                        {selectedProduct.product_images && selectedProduct.product_images.length > 0 ? (
                                            <img
                                                src={selectedProduct.product_images.find(img => img.is_main)?.image_url || selectedProduct.product_images[0].image_url}
                                                alt={selectedProduct.name}
                                                className="w-full h-full object-cover"
                                                crossOrigin="anonymous"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <ImageIcon className="w-24 h-24" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                    <div className="absolute bottom-0 left-0 w-full p-8 text-white">
                                        <div className="border-l-4 pl-4 mb-4" style={{ borderColor: accentColor }}>
                                            <h2 className="text-5xl font-black uppercase leading-none mb-2" style={{ fontFamily: fontHeading }}>
                                                {selectedProduct.name}
                                            </h2>
                                            <p className="text-2xl font-light">{customText}</p>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-3xl font-bold" style={{ color: accentColor }}>
                                                ₹{selectedProduct.base_price}
                                            </span>
                                            {brand?.logo_url && <img src={brand.logo_url} alt="Logo" className="h-8 opacity-80" />}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Template: Story */}
                            {template.id === 'story' && (
                                <div className="w-full h-full flex flex-col relative" style={{ backgroundColor: primaryColor, color: secondaryColor }}>
                                    <div className="p-8 text-center">
                                        <p className="uppercase tracking-[0.3em] text-xs mb-4 opacity-70">Just Dropped</p>
                                        <h2 className="text-4xl font-bold uppercase" style={{ fontFamily: fontHeading, color: accentColor }}>
                                            {selectedProduct.name}
                                        </h2>
                                    </div>
                                    <div className="flex-1 relative mx-4 mb-4 rounded-2xl overflow-hidden border-2" style={{ borderColor: accentColor }}>
                                        {/* Placeholder Image */}
                                        {selectedProduct.product_images && selectedProduct.product_images.length > 0 ? (
                                            <img
                                                src={selectedProduct.product_images.find(img => img.is_main)?.image_url || selectedProduct.product_images[0].image_url}
                                                alt={selectedProduct.name}
                                                className="w-full h-full object-cover"
                                                crossOrigin="anonymous"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-600">
                                                <ImageIcon className="w-20 h-20" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-8 pt-0 text-center space-y-4">
                                        <p className="text-lg">{customText}</p>
                                        <div className="animate-bounce mt-4">
                                            <span className="text-xs uppercase tracking-widest opacity-50">Link in Bio</span>
                                            <div className="w-0.5 h-8 bg-current mx-auto mt-2" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p>Select a product to preview campaign assets</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CampaignBuilder;
