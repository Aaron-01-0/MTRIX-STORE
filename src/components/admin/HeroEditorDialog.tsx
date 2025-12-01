import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    X,
    Image as ImageIcon,
    Save,
    Loader2,
    Trash2,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Palette,
    Smartphone,
    Monitor,
    Type,
    Layers,
    Zap,
    Eye,
    HelpCircle,
    Maximize2
} from 'lucide-react';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- Constants ---

const GRADIENT_PRESETS = [
    { name: 'Dark Bottom', value: 'bg-gradient-to-t from-black via-black/50 to-transparent' },
    { name: 'Dark Overlay', value: 'bg-black/40' },
    { name: 'Gold Mist', value: 'bg-gradient-to-r from-black/80 via-black/40 to-primary/20' },
    { name: 'Cinematic', value: 'bg-gradient-to-r from-black/90 via-transparent to-black/90' },
    { name: 'Vignette', value: 'bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]' },
    { name: 'None', value: 'none' },
];

const COLOR_PALETTE = [
    { name: 'White', value: '#ffffff', class: 'bg-white' },
    { name: 'Primary (Gold)', value: '#D4AF37', class: 'bg-primary' },
    { name: 'Black', value: '#000000', class: 'bg-black' },
    { name: 'Gray', value: '#9CA3AF', class: 'bg-gray-400' },
    { name: 'Red', value: '#EF4444', class: 'bg-red-500' },
];

// --- Types ---

interface HeroImageConfig {
    headline_size?: number;
    headline_weight?: string;
    headline_color?: string;
    subtitle_size?: number;
    subtitle_color?: string;
    subtitle_alignment?: 'left' | 'center' | 'right';
    button_style?: 'solid' | 'outline' | 'ghost';
    button_color?: string;
    button_text_color?: string;
    overlay_color?: string;
    overlay_opacity?: number;
    overlay_gradient_direction?: string;
    animation_style?: 'fade' | 'slide' | 'zoom' | 'ken-burns';
    animation_duration?: number;
    content_width?: number;
    vertical_alignment?: 'top' | 'center' | 'bottom';
    text_shadow?: 'none' | 'soft' | 'hard';
}

interface HeroImage {
    id: string;
    image_url: string;
    mobile_image_url?: string;
    title?: string;
    subtitle?: string;
    alt_text?: string;
    button_text?: string;
    button_link?: string;
    display_order: number;
    is_active: boolean;
    text_alignment?: 'left' | 'center' | 'right';
    text_color?: string;
    overlay_gradient?: string;
    schedule_start?: string;
    schedule_end?: string;
    config: HeroImageConfig;
}

const HeroEditorDialog = () => {
    const [open, setOpen] = useState(false);
    const { uploadFile, uploading } = useStorageUpload();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
    const [localImages, setLocalImages] = useState<HeroImage[]>([]);
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

    // Fetch data when dialog opens
    useEffect(() => {
        if (open) {
            fetchHeroImages();
        }
    }, [open]);

    const fetchHeroImages = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('hero_images')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;

            const formattedData = data?.map(img => ({
                ...img,
                config: img.config || {}
            })) as HeroImage[];

            setLocalImages(formattedData || []);
            if (formattedData && formattedData.length > 0 && !selectedSlideId) {
                setSelectedSlideId(formattedData[0].id);
            }
        } catch (error) {
            console.error('Error fetching hero images:', error);
            toast({ title: "Error", description: "Failed to load hero images.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const activeSlide = localImages.find(img => img.id === selectedSlideId);
    const activeIndex = localImages.findIndex(img => img.id === selectedSlideId);

    // --- Handlers ---

    const handleUpload = async (file: File, type: 'desktop' | 'mobile' = 'desktop', targetId?: string) => {
        try {
            const url = await uploadFile(file, {
                bucket: 'hero-images',
                folder: 'carousel',
                maxSizeMB: 20
            });

            if (!url) return;

            if (targetId) {
                // Optimistic update
                const updates: any = {};
                if (type === 'desktop') updates.image_url = url;
                else updates.mobile_image_url = url;

                const updatedList = localImages.map(img => img.id === targetId ? { ...img, ...updates } : img);
                setLocalImages(updatedList);

                const { error } = await supabase
                    .from('hero_images')
                    .update(updates)
                    .eq('id', targetId);

                if (error) throw error;
                toast({ title: "Success", description: "Image updated." });

            } else {
                // New Slide
                const defaultConfig: HeroImageConfig = {
                    headline_size: 5,
                    headline_weight: '700',
                    overlay_opacity: 50,
                    animation_style: 'fade',
                    content_width: 80,
                    vertical_alignment: 'center',
                    subtitle_alignment: 'center'
                };

                const { data, error } = await supabase
                    .from('hero_images')
                    .insert({
                        image_url: url,
                        alt_text: file.name,
                        display_order: localImages.length,
                        is_active: true,
                        text_alignment: 'center',
                        text_color: '#ffffff',
                        overlay_gradient: 'bg-gradient-to-t from-black via-black/50 to-transparent',
                        config: defaultConfig as any
                    })
                    .select()
                    .single();

                if (error) throw error;

                const newSlide = {
                    ...data,
                    config: defaultConfig
                } as HeroImage;

                const updatedList = [...localImages, newSlide];
                setLocalImages(updatedList);
                setSelectedSlideId(newSlide.id);
                toast({ title: "Success", description: "New slide created." });
            }
        } catch (error: any) {
            console.error('Error uploading:', error);
            toast({ title: "Error", description: "Upload failed.", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this slide?')) return;
        try {
            const { error } = await supabase.from('hero_images').delete().eq('id', id);
            if (error) throw error;

            const newImages = localImages.filter(img => img.id !== id);
            setLocalImages(newImages);
            if (selectedSlideId === id && newImages.length > 0) {
                setSelectedSlideId(newImages[0].id);
            } else if (newImages.length === 0) {
                setSelectedSlideId(null);
            }
            toast({ title: "Deleted", description: "Slide removed." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
        }
    };

    const handleLocalUpdate = (field: keyof HeroImage, value: any) => {
        if (activeIndex === -1) return;
        const updated = [...localImages];
        updated[activeIndex] = { ...updated[activeIndex], [field]: value };
        setLocalImages(updated);
    };

    const handleConfigUpdate = (field: keyof HeroImageConfig, value: any) => {
        if (activeIndex === -1) return;
        const updated = [...localImages];
        updated[activeIndex] = {
            ...updated[activeIndex],
            config: { ...updated[activeIndex].config, [field]: value }
        };
        setLocalImages(updated);
    };

    const handleSave = async () => {
        if (!activeSlide) return;
        setSavingId(activeSlide.id);
        try {
            const { error } = await supabase
                .from('hero_images')
                .update({
                    title: activeSlide.title,
                    subtitle: activeSlide.subtitle,
                    alt_text: activeSlide.alt_text,
                    button_text: activeSlide.button_text,
                    button_link: activeSlide.button_link,
                    is_active: activeSlide.is_active,
                    display_order: activeSlide.display_order,
                    text_alignment: activeSlide.text_alignment,
                    text_color: activeSlide.text_color,
                    overlay_gradient: activeSlide.overlay_gradient,
                    mobile_image_url: activeSlide.mobile_image_url,
                    schedule_start: activeSlide.schedule_start,
                    schedule_end: activeSlide.schedule_end,
                    config: activeSlide.config as any
                })
                .eq('id', activeSlide.id);

            if (error) throw error;
            toast({ title: "Saved", description: "Changes saved successfully." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
        } finally {
            setSavingId(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-gold text-black hover:shadow-gold transition-all font-bold">
                    <Maximize2 className="w-4 h-4 mr-2" /> Open Hero Builder
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] w-full h-[95vh] bg-mtrix-black border-white/10 p-0 overflow-hidden flex flex-col">
                <DialogHeader className="p-4 border-b border-white/10 bg-black/40 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-orbitron text-gradient-gold flex items-center gap-2">
                            <ImageIcon className="w-5 h-5" /> Hero Builder
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <input
                                    type="file"
                                    id="hero-upload-new-dialog"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                                    disabled={uploading}
                                />
                                <Label
                                    htmlFor="hero-upload-new-dialog"
                                    className={`cursor-pointer inline-flex items-center gap-2 bg-primary text-black px-4 py-2 rounded-md text-sm font-bold hover:bg-primary/90 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                                    Add New Slide
                                </Label>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT: Editor Panel */}
                    <div className="w-[400px] border-r border-white/10 flex flex-col bg-black/20 flex-shrink-0">
                        {/* Slide Selector */}
                        <div className="p-4 border-b border-white/10 bg-black/40">
                            <Label className="text-xs text-muted-foreground mb-2 block">Select Slide to Edit</Label>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {localImages.map((img, idx) => (
                                    <button
                                        key={img.id}
                                        onClick={() => setSelectedSlideId(img.id)}
                                        className={cn(
                                            "relative w-20 h-14 rounded border transition-all flex-shrink-0 overflow-hidden group",
                                            selectedSlideId === img.id ? "border-primary ring-2 ring-primary/20" : "border-white/10 opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <img src={img.image_url} className="w-full h-full object-cover" />
                                        <div className="absolute top-0 left-0 bg-black/60 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-br">
                                            {idx + 1}
                                        </div>
                                    </button>
                                ))}
                                {localImages.length === 0 && (
                                    <div className="text-xs text-muted-foreground italic p-2">No slides yet. Add one!</div>
                                )}
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-4">
                                {activeSlide ? (
                                    <Tabs defaultValue="content" className="w-full">
                                        <TabsList className="bg-black/40 border border-white/10 w-full justify-start mb-4 flex-wrap h-auto gap-1">
                                            <TabsTrigger value="content" className="data-[state=active]:bg-primary data-[state=active]:text-black text-xs h-8"><Layers className="w-3 h-3 mr-1" /> Content</TabsTrigger>
                                            <TabsTrigger value="design" className="data-[state=active]:bg-primary data-[state=active]:text-black text-xs h-8"><Palette className="w-3 h-3 mr-1" /> Design</TabsTrigger>
                                            <TabsTrigger value="style" className="data-[state=active]:bg-primary data-[state=active]:text-black text-xs h-8"><Type className="w-3 h-3 mr-1" /> Style</TabsTrigger>
                                            <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-black text-xs h-8"><Zap className="w-3 h-3 mr-1" /> Settings</TabsTrigger>
                                        </TabsList>

                                        {/* CONTENT TAB */}
                                        <TabsContent value="content" className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Headline</Label>
                                                <Input value={activeSlide.title || ''} onChange={(e) => handleLocalUpdate('title', e.target.value)} className="bg-black/20 border-white/10" placeholder="Enter headline..." />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Subtitle</Label>
                                                <Input value={activeSlide.subtitle || ''} onChange={(e) => handleLocalUpdate('subtitle', e.target.value)} className="bg-black/20 border-white/10" placeholder="Enter subtitle..." />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Button Text</Label>
                                                    <Input value={activeSlide.button_text || ''} onChange={(e) => handleLocalUpdate('button_text', e.target.value)} className="bg-black/20 border-white/10" placeholder="e.g. Shop Now" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Link</Label>
                                                    <Input value={activeSlide.button_link || ''} onChange={(e) => handleLocalUpdate('button_link', e.target.value)} className="bg-black/20 border-white/10" placeholder="/collections/all" />
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-white/10 space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Monitor className="w-3 h-3" /> Desktop Image</Label>
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative w-16 h-10 bg-black/40 rounded overflow-hidden border border-white/10">
                                                            <img src={activeSlide.image_url} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="relative flex-1">
                                                            <input type="file" id="up-desk-d" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'desktop', activeSlide.id)} />
                                                            <Label htmlFor="up-desk-d" className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 w-full py-2 rounded-md flex items-center justify-center gap-2 text-xs text-white transition-colors">
                                                                <ImageIcon className="w-3 h-3" /> Replace Image
                                                            </Label>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Smartphone className="w-3 h-3" /> Mobile Image (Optional)</Label>
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative w-10 h-16 bg-black/40 rounded overflow-hidden border border-white/10">
                                                            {activeSlide.mobile_image_url ? (
                                                                <img src={activeSlide.mobile_image_url} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Smartphone className="w-4 h-4 opacity-20" /></div>
                                                            )}
                                                        </div>
                                                        <div className="relative flex-1">
                                                            <input type="file" id="up-mob-d" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'mobile', activeSlide.id)} />
                                                            <Label htmlFor="up-mob-d" className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 w-full py-2 rounded-md flex items-center justify-center gap-2 text-xs text-white transition-colors">
                                                                <ImageIcon className="w-3 h-3" /> {activeSlide.mobile_image_url ? 'Replace' : 'Upload'} Mobile
                                                            </Label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        {/* DESIGN TAB */}
                                        <TabsContent value="design" className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Vertical Alignment</Label>
                                                <div className="flex bg-black/20 rounded-md p-1 border border-white/10">
                                                    {(['top', 'center', 'bottom'] as const).map((align) => (
                                                        <button key={align} onClick={() => handleConfigUpdate('vertical_alignment', align)} className={cn("flex-1 p-2 rounded flex justify-center transition-colors capitalize text-xs", (activeSlide.config?.vertical_alignment || 'center') === align ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/5')}>
                                                            {align}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Text Alignment</Label>
                                                <div className="flex bg-black/20 rounded-md p-1 border border-white/10">
                                                    {(['left', 'center', 'right'] as const).map((align) => (
                                                        <button key={align} onClick={() => handleLocalUpdate('text_alignment', align)} className={`flex-1 p-2 rounded flex justify-center transition-colors ${activeSlide.text_alignment === align ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/5'}`}>
                                                            {align === 'left' && <AlignLeft className="w-4 h-4" />}
                                                            {align === 'center' && <AlignCenter className="w-4 h-4" />}
                                                            {align === 'right' && <AlignRight className="w-4 h-4" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Content Width ({activeSlide.config?.content_width || 80}%)</Label>
                                                <Slider value={[activeSlide.config?.content_width || 80]} max={100} min={20} step={5} onValueChange={([v]) => handleConfigUpdate('content_width', v)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Overlay Opacity ({activeSlide.config?.overlay_opacity || 50}%)</Label>
                                                <Slider value={[activeSlide.config?.overlay_opacity || 50]} max={100} step={5} onValueChange={([v]) => handleConfigUpdate('overlay_opacity', v)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Overlay Gradient</Label>
                                                <Select value={activeSlide.overlay_gradient || ''} onValueChange={(v) => handleLocalUpdate('overlay_gradient', v)}>
                                                    <SelectTrigger className="bg-black/20 border-white/10"><SelectValue placeholder="Select Gradient" /></SelectTrigger>
                                                    <SelectContent>
                                                        {GRADIENT_PRESETS.map((g) => (
                                                            <SelectItem key={g.name} value={g.value}>{g.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Gradient Direction</Label>
                                                <Select value={activeSlide.config?.overlay_gradient_direction || 'to-t'} onValueChange={(v) => handleConfigUpdate('overlay_gradient_direction', v)}>
                                                    <SelectTrigger className="bg-black/20 border-white/10"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="to-t">Bottom to Top</SelectItem>
                                                        <SelectItem value="to-b">Top to Bottom</SelectItem>
                                                        <SelectItem value="to-r">Left to Right</SelectItem>
                                                        <SelectItem value="to-l">Right to Left</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TabsContent>

                                        {/* STYLE TAB */}
                                        <TabsContent value="style" className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Text Color</Label>
                                                <div className="flex gap-2 flex-wrap">
                                                    {COLOR_PALETTE.map((color) => (
                                                        <button
                                                            key={color.name}
                                                            onClick={() => handleLocalUpdate('text_color', color.value)}
                                                            className={cn(
                                                                "w-8 h-8 rounded-full border-2 transition-all",
                                                                color.class,
                                                                activeSlide.text_color === color.value ? "border-primary scale-110" : "border-transparent opacity-70 hover:opacity-100"
                                                            )}
                                                            title={color.name}
                                                        />
                                                    ))}
                                                    <input
                                                        type="color"
                                                        value={activeSlide.text_color || '#ffffff'}
                                                        onChange={(e) => handleLocalUpdate('text_color', e.target.value)}
                                                        className="w-8 h-8 rounded-full overflow-hidden border-0 p-0 cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Headline Size ({activeSlide.config?.headline_size || 5}rem)</Label>
                                                <Slider value={[activeSlide.config?.headline_size || 5]} max={10} min={2} step={0.5} onValueChange={([v]) => handleConfigUpdate('headline_size', v)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Headline Weight</Label>
                                                <Select value={activeSlide.config?.headline_weight || '700'} onValueChange={(v) => handleConfigUpdate('headline_weight', v)}>
                                                    <SelectTrigger className="bg-black/20 border-white/10"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="300">Light</SelectItem>
                                                        <SelectItem value="400">Regular</SelectItem>
                                                        <SelectItem value="700">Bold</SelectItem>
                                                        <SelectItem value="900">Black</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Text Shadow</Label>
                                                <Select value={activeSlide.config?.text_shadow || 'none'} onValueChange={(v) => handleConfigUpdate('text_shadow', v)}>
                                                    <SelectTrigger className="bg-black/20 border-white/10"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">None</SelectItem>
                                                        <SelectItem value="soft">Soft Glow</SelectItem>
                                                        <SelectItem value="hard">Hard Shadow</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Subtitle Alignment</Label>
                                                <div className="flex bg-black/20 rounded-md p-1 border border-white/10">
                                                    {(['left', 'center', 'right'] as const).map((align) => (
                                                        <button
                                                            key={align}
                                                            onClick={() => handleConfigUpdate('subtitle_alignment', align)}
                                                            className={cn(
                                                                "flex-1 p-2 rounded flex justify-center transition-colors",
                                                                (activeSlide.config?.subtitle_alignment || activeSlide.text_alignment || 'center') === align
                                                                    ? 'bg-primary/20 text-primary'
                                                                    : 'text-muted-foreground hover:bg-white/5'
                                                            )}
                                                        >
                                                            {align === 'left' && <AlignLeft className="w-4 h-4" />}
                                                            {align === 'center' && <AlignCenter className="w-4 h-4" />}
                                                            {align === 'right' && <AlignRight className="w-4 h-4" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Button Style</Label>
                                                <Select value={activeSlide.config?.button_style || 'solid'} onValueChange={(v) => handleConfigUpdate('button_style', v)}>
                                                    <SelectTrigger className="bg-black/20 border-white/10"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="solid">Solid Fill</SelectItem>
                                                        <SelectItem value="outline">Outline</SelectItem>
                                                        <SelectItem value="ghost">Ghost</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TabsContent>

                                        {/* SETTINGS TAB */}
                                        <TabsContent value="settings" className="space-y-4">
                                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                                                <Label>Active Status</Label>
                                                <Switch checked={activeSlide.is_active} onCheckedChange={(c) => handleLocalUpdate('is_active', c)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Animation</Label>
                                                <Select value={activeSlide.config?.animation_style || 'fade'} onValueChange={(v) => handleConfigUpdate('animation_style', v)}>
                                                    <SelectTrigger className="bg-black/20 border-white/10"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="fade">Fade</SelectItem>
                                                        <SelectItem value="slide">Slide</SelectItem>
                                                        <SelectItem value="zoom">Zoom</SelectItem>
                                                        <SelectItem value="ken-burns">Ken Burns</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button variant="destructive" className="w-full mt-8" onClick={() => handleDelete(activeSlide.id)}>
                                                <Trash2 className="w-4 h-4 mr-2" /> Delete Slide
                                            </Button>
                                        </TabsContent>

                                    </Tabs>
                                ) : (
                                    <div className="text-center text-muted-foreground py-10 flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                            <ImageIcon className="w-8 h-8 opacity-50" />
                                        </div>
                                        <p>Select a slide to edit or create a new one.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        <div className="p-4 border-t border-white/10 bg-black/40">
                            <Button onClick={handleSave} disabled={!activeSlide || !!savingId} className="w-full bg-primary text-black hover:bg-white font-bold h-12 text-lg">
                                {savingId ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />} Save Changes
                            </Button>
                        </div>
                    </div>

                    {/* RIGHT: Live Preview */}
                    <div className="flex-1 flex flex-col bg-black relative">
                        <div className="absolute top-4 right-4 z-50 flex gap-2">
                            <div className="bg-black/60 backdrop-blur-md border border-white/10 p-1 rounded-lg flex gap-1">
                                <button
                                    onClick={() => setPreviewMode('desktop')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                                        previewMode === 'desktop' ? "bg-primary text-black shadow-sm" : "text-gray-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <Monitor className="w-3 h-3" /> Desktop
                                </button>
                                <button
                                    onClick={() => setPreviewMode('mobile')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                                        previewMode === 'mobile' ? "bg-primary text-black shadow-sm" : "text-gray-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <Smartphone className="w-3 h-3" /> Mobile
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden flex items-center justify-center p-8 bg-zinc-950/50">
                            {activeSlide ? (
                                <div
                                    className={cn(
                                        "relative transition-all duration-500 ease-in-out shadow-2xl overflow-hidden bg-black group",
                                        previewMode === 'mobile'
                                            ? "w-[375px] h-[667px] rounded-[2.5rem] border-[8px] border-gray-800 ring-1 ring-white/10"
                                            : "w-full h-full rounded-lg border border-white/10"
                                    )}
                                >
                                    {/* Background Image */}
                                    <img
                                        key={`${activeSlide.id}-${previewMode}`}
                                        src={previewMode === 'mobile' ? (activeSlide.mobile_image_url || activeSlide.image_url) : activeSlide.image_url}
                                        className={cn(
                                            "w-full h-full object-cover transition-transform duration-1000",
                                            activeSlide.config?.animation_style === 'zoom' && "scale-110"
                                        )}
                                        style={{
                                            animationDuration: `${activeSlide.config?.animation_duration || 10}s`
                                        }}
                                    />

                                    {/* Overlay */}
                                    <div
                                        className={cn("absolute inset-0", activeSlide.overlay_gradient === 'none' ? '' : activeSlide.overlay_gradient)}
                                        style={{ opacity: (activeSlide.config?.overlay_opacity || 50) / 100 }}
                                    />

                                    {/* Content */}
                                    <div className={cn(
                                        "absolute inset-0 flex flex-col justify-center p-6 md:p-12",
                                        activeSlide.text_alignment === 'left' ? 'items-start' :
                                            activeSlide.text_alignment === 'right' ? 'items-end' :
                                                'items-center'
                                    )}>
                                        <div
                                            style={{ width: `${activeSlide.config?.content_width || 80}%` }}
                                            className={cn(
                                                "flex flex-col",
                                                activeSlide.text_alignment === 'left' ? 'text-left items-start' :
                                                    activeSlide.text_alignment === 'right' ? 'text-right items-end' :
                                                        'text-center items-center'
                                            )}
                                        >
                                            <h2
                                                className="font-orbitron mb-4 leading-tight text-white transition-all"
                                                style={{
                                                    fontSize: previewMode === 'mobile'
                                                        ? `${Math.max(2, (activeSlide.config?.headline_size || 5) * 0.6)}rem` // Scale down for mobile
                                                        : `${activeSlide.config?.headline_size || 5}rem`,
                                                    fontWeight: activeSlide.config?.headline_weight || '700',
                                                    color: activeSlide.text_color || '#ffffff'
                                                }}
                                            >
                                                {activeSlide.title || 'Your Headline Here'}
                                            </h2>

                                            {activeSlide.subtitle && (
                                                <p className={cn(
                                                    "text-gray-200 mb-8 font-light transition-all",
                                                    previewMode === 'mobile' ? "text-lg" : "text-xl md:text-2xl",
                                                    activeSlide.config?.subtitle_alignment === 'left' ? 'text-left' :
                                                        activeSlide.config?.subtitle_alignment === 'right' ? 'text-right' :
                                                            activeSlide.config?.subtitle_alignment === 'center' ? 'text-center' :
                                                                ''
                                                )}>
                                                    {activeSlide.subtitle}
                                                </p>
                                            )}

                                            {(activeSlide.button_text) && (
                                                <Button
                                                    size={previewMode === 'mobile' ? "default" : "lg"}
                                                    className={cn(
                                                        "rounded-none transition-all duration-300",
                                                        previewMode === 'mobile' ? "text-sm px-6 py-4" : "text-lg px-8 py-6",
                                                        activeSlide.config?.button_style === 'outline' ? "bg-transparent border-2 border-white text-white hover:bg-white hover:text-black" :
                                                            activeSlide.config?.button_style === 'ghost' ? "bg-transparent text-white hover:bg-white/10" :
                                                                "bg-white text-black hover:bg-primary hover:text-black border-2 border-transparent"
                                                    )}
                                                >
                                                    {activeSlide.button_text}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                                    <Eye className="w-12 h-12 opacity-20" />
                                    <p>Preview will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default HeroEditorDialog;
