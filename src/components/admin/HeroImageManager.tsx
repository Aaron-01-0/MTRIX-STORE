import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  X,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
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
  Calendar as CalendarIcon,
  Clock,
  Eye,
  Check
} from 'lucide-react';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';

// --- Constants ---

const GRADIENT_PRESETS = [
  { name: 'Dark Bottom', value: 'bg-gradient-to-t from-black via-black/50 to-transparent' },
  { name: 'Dark Overlay', value: 'bg-black/40' },
  { name: 'Gold Mist', value: 'bg-gradient-to-r from-black/80 via-black/40 to-primary/20' },
  { name: 'Cinematic', value: 'bg-gradient-to-r from-black/90 via-transparent to-black/90' },
  { name: 'Vignette', value: 'bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]' },
  { name: 'None', value: '' },
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

interface HeroImageManagerProps {
  images: HeroImage[];
  onChange: (images: HeroImage[]) => void;
}

const HeroImageManager = ({ images, onChange }: HeroImageManagerProps) => {
  const { uploadFile, uploading } = useStorageUpload();
  const { toast } = useToast();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [localImages, setLocalImages] = useState<HeroImage[]>(images);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Sync props to local state
  useEffect(() => {
    setLocalImages(images);
  }, [images]);

  // Select first slide by default
  useEffect(() => {
    if (localImages.length > 0 && !selectedSlideId) {
      setSelectedSlideId(localImages[0].id);
    }
  }, [localImages]); // Depend on localImages, not images prop directly

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
        setLocalImages(updatedList); // Update local state immediately
        onChange(updatedList); // Notify parent

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
          vertical_alignment: 'center'
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
            config: defaultConfig
          })
          .select()
          .single();

        if (error) throw error;

        const newSlide = {
          id: data.id,
          image_url: url,
          alt_text: file.name,
          display_order: localImages.length,
          is_active: true,
          text_alignment: 'center',
          text_color: '#ffffff',
          overlay_gradient: 'bg-gradient-to-t from-black via-black/50 to-transparent',
          config: defaultConfig
        } as HeroImage;

        const updatedList = [...localImages, newSlide];
        setLocalImages(updatedList);
        onChange(updatedList);
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
      onChange(newImages);
      if (selectedSlideId === id && newImages.length > 0) {
        setSelectedSlideId(newImages[0].id);
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
    onChange(updated);
  };

  const handleConfigUpdate = (field: keyof HeroImageConfig, value: any) => {
    if (activeIndex === -1) return;
    const updated = [...localImages];
    updated[activeIndex] = {
      ...updated[activeIndex],
      config: { ...updated[activeIndex].config, [field]: value }
    };
    setLocalImages(updated);
    onChange(updated);
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
          config: activeSlide.config
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-100px)]">

      {/* LEFT: Editor Panel */}
      <Card className="lg:col-span-4 bg-mtrix-black border-mtrix-gray flex flex-col h-full overflow-hidden">
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-gradient-gold text-xl">Hero Builder</CardTitle>
            <div className="relative">
              <input
                type="file"
                id="hero-upload-new"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                disabled={uploading}
              />
              <Label
                htmlFor="hero-upload-new"
                className={`cursor-pointer inline-flex items-center gap-2 bg-primary text-black px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                Add Slide
              </Label>
            </div>
          </div>

          {/* Slide Selector */}
          <div className="flex gap-2 overflow-x-auto py-2 mt-4 scrollbar-hide">
            {localImages.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setSelectedSlideId(img.id)}
                className={cn(
                  "relative w-16 h-12 rounded border transition-all flex-shrink-0 overflow-hidden group",
                  selectedSlideId === img.id ? "border-primary ring-2 ring-primary/20" : "border-white/10 opacity-60 hover:opacity-100"
                )}
              >
                <img src={img.image_url} className="w-full h-full object-cover" />
                <div className="absolute top-0 left-0 bg-black/60 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-br">
                  {idx + 1}
                </div>
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
          {activeSlide ? (
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="bg-black/40 border border-white/10 w-full justify-start mb-4 flex-wrap h-auto gap-1">
                <TabsTrigger value="content" className="data-[state=active]:bg-primary data-[state=active]:text-black"><Layers className="w-3 h-3 mr-1" /> Content</TabsTrigger>
                <TabsTrigger value="design" className="data-[state=active]:bg-primary data-[state=active]:text-black"><Palette className="w-3 h-3 mr-1" /> Design</TabsTrigger>
                <TabsTrigger value="style" className="data-[state=active]:bg-primary data-[state=active]:text-black"><Type className="w-3 h-3 mr-1" /> Style</TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-black"><Zap className="w-3 h-3 mr-1" /> Settings</TabsTrigger>
              </TabsList>

              {/* CONTENT TAB */}
              <TabsContent value="content" className="space-y-4">
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Input value={activeSlide.title || ''} onChange={(e) => handleLocalUpdate('title', e.target.value)} className="bg-black/20 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input value={activeSlide.subtitle || ''} onChange={(e) => handleLocalUpdate('subtitle', e.target.value)} className="bg-black/20 border-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input value={activeSlide.button_text || ''} onChange={(e) => handleLocalUpdate('button_text', e.target.value)} className="bg-black/20 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Link</Label>
                    <Input value={activeSlide.button_link || ''} onChange={(e) => handleLocalUpdate('button_link', e.target.value)} className="bg-black/20 border-white/10" />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Monitor className="w-4 h-4" /> Desktop Image</Label>
                    <div className="flex items-center gap-2">
                      <Input value={activeSlide.image_url} readOnly className="flex-1 bg-black/20 border-white/10 text-xs text-muted-foreground" />
                      <div className="relative">
                        <input type="file" id="up-desk" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'desktop', activeSlide.id)} />
                        <Label htmlFor="up-desk" className="cursor-pointer bg-white/10 hover:bg-white/20 px-3 py-2 rounded-md flex items-center gap-2 text-sm text-white transition-colors">
                          <ImageIcon className="w-4 h-4" /> Change
                        </Label>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Smartphone className="w-4 h-4" /> Mobile Image</Label>
                    <div className="flex items-center gap-2">
                      <Input value={activeSlide.mobile_image_url || 'Not set'} readOnly className="flex-1 bg-black/20 border-white/10 text-xs text-muted-foreground" />
                      <div className="relative">
                        <input type="file" id="up-mob" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'mobile', activeSlide.id)} />
                        <Label htmlFor="up-mob" className="cursor-pointer bg-white/10 hover:bg-white/20 px-3 py-2 rounded-md flex items-center gap-2 text-sm text-white transition-colors">
                          <ImageIcon className="w-4 h-4" /> Change
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* DESIGN TAB */}
              <TabsContent value="design" className="space-y-4">
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
                <div className="flex items-center justify-between">
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
                <Button variant="destructive" className="w-full mt-4" onClick={() => handleDelete(activeSlide.id)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Slide
                </Button>
              </TabsContent>

            </Tabs>
          ) : (
            <div className="text-center text-muted-foreground py-10">Select a slide to edit</div>
          )}
        </CardContent>

        <div className="p-4 border-t border-white/10 bg-black/20">
          <Button onClick={handleSave} disabled={!activeSlide || !!savingId} className="w-full bg-primary text-black hover:bg-white">
            {savingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Changes
          </Button>
        </div>
      </Card>

      {/* RIGHT: Live Preview */}
      <div className="lg:col-span-8 flex flex-col h-full">
        <div className="bg-black/40 border border-white/10 rounded-t-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-white">Live Preview</span>
          </div>
          <div className="flex gap-1 bg-black/50 p-1 rounded-lg border border-white/10">
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

        <div className="flex-1 bg-black border-x border-b border-white/10 rounded-b-xl overflow-hidden relative group flex items-center justify-center p-4 lg:p-8">
          {activeSlide ? (
            <div
              className={cn(
                "relative transition-all duration-500 ease-in-out shadow-2xl overflow-hidden bg-black",
                previewMode === 'mobile'
                  ? "w-[375px] h-[667px] rounded-[2.5rem] border-[8px] border-gray-800 ring-1 ring-white/10"
                  : "w-full h-full rounded-none border-0"
              )}
            >
              {/* Background Image */}
              <img
                key={`${activeSlide.id}-${previewMode}`} // Force re-render on mode change
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
                className={cn("absolute inset-0", activeSlide.overlay_gradient)}
                style={{ opacity: (activeSlide.config?.overlay_opacity || 50) / 100 }}
              />

              {/* Content */}
              <div className={cn(
                "absolute inset-0 flex flex-col justify-center p-6 md:p-12",
                activeSlide.text_alignment === 'left' ? 'items-start text-left' :
                  activeSlide.text_alignment === 'right' ? 'items-end text-right' :
                    'items-center text-center'
              )}>
                <div style={{ width: `${activeSlide.config?.content_width || 80}%` }}>
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
                      previewMode === 'mobile' ? "text-lg" : "text-xl md:text-2xl"
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
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a slide to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroImageManager;
