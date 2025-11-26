import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import HeroImageManager from '@/components/admin/HeroImageManager';
import CategoryManager from '@/components/admin/CategoryManager';
import BundleManager from '@/components/admin/BundleManager';
import PromotionStripManager from '@/components/admin/PromotionStripManager';
import { Image as ImageIcon, Layers, Package, Tag } from 'lucide-react';

interface HeroImageData {
    id: string;
    image_url: string;
    title: string | null;
    subtitle: string | null;
    alt_text: string | null;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

const ContentManagerWrapper = () => {
    const [heroImages, setHeroImages] = useState<Array<{
        id: string;
        url: string;
        title?: string;
        subtitle?: string;
        alt?: string;
        button_text?: string;
        button_link?: string;
        display_order: number;
        is_active: boolean;
    }>>([]);

    useEffect(() => {
        fetchHeroImages();
    }, []);

    const fetchHeroImages = async () => {
        try {
            const { data, error } = await supabase
                .from('hero_images' as any)
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;

            const heroImagesData = data as unknown as HeroImageData[] | null;

            setHeroImages(heroImagesData?.map(img => ({
                id: img.id,
                url: img.image_url,
                title: img.title || undefined,
                subtitle: img.subtitle || undefined,
                alt: img.alt_text || undefined,
                button_text: (img as any).button_text || undefined,
                button_link: (img as any).button_link || undefined,
                display_order: img.display_order,
                is_active: img.is_active
            })) || []);
        } catch (error) {
            console.error('Error fetching hero images:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-orbitron font-bold text-gradient-gold">Content Management</h2>
                <p className="text-muted-foreground">Manage your store's visual content and organization.</p>
            </div>

            <Tabs defaultValue="hero" className="space-y-6">
                <TabsList className="bg-mtrix-dark border border-mtrix-gray">
                    <TabsTrigger value="hero" className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Hero Images
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="flex items-center gap-2">
                        <Layers className="w-4 h-4" /> Categories
                    </TabsTrigger>
                    <TabsTrigger value="bundles" className="flex items-center gap-2">
                        <Package className="w-4 h-4" /> Bundles
                    </TabsTrigger>
                    <TabsTrigger value="promotions" className="flex items-center gap-2">
                        <Tag className="w-4 h-4" /> Promotions
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="hero">
                    <HeroImageManager
                        images={heroImages}
                        onChange={(newImages) => {
                            setHeroImages(newImages);
                        }}
                    />
                </TabsContent>

                <TabsContent value="categories">
                    <CategoryManager />
                </TabsContent>

                <TabsContent value="bundles">
                    <BundleManager />
                </TabsContent>

                <TabsContent value="promotions">
                    <PromotionStripManager />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ContentManagerWrapper;
