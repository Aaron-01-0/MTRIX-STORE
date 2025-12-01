import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HeroEditorDialog from '@/components/admin/HeroEditorDialog';
import CategoryManager from '@/components/admin/CategoryManager';
import BundleManager from '@/components/admin/BundleManager';
import PromotionStripManager from '@/components/admin/PromotionStripManager';
import { Image as ImageIcon, Layers, Package, Tag } from 'lucide-react';



const ContentManagerWrapper = () => {
    const [activeTab, setActiveTab] = useState('hero');

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
                    <div className="flex flex-col items-center justify-center py-12 bg-black/20 border border-white/10 rounded-lg space-y-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-primary" />
                        </div>
                        <div className="text-center max-w-md">
                            <h3 className="text-xl font-bold text-white mb-2">Hero Section Builder</h3>
                            <p className="text-muted-foreground mb-6">Create stunning hero sections with our advanced builder. Manage slides, animations, and responsive designs in a dedicated workspace.</p>
                            <HeroEditorDialog />
                        </div>
                    </div>
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
