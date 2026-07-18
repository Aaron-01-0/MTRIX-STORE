import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SHOWCASE_PRODUCTS } from '@/data/mockData';

export interface WishlistItem {
    id: string;
    product_id: string;
    product: {
        id: string;
        name: string;
        base_price: number;
        discount_price?: number;
        image_url?: string;
    };
}

interface WishlistContextType {
    wishlistItems: WishlistItem[];
    loading: boolean;
    addToWishlist: (productId: string) => Promise<void>;
    removeFromWishlist: (itemId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() => {
        try {
            const saved = localStorage.getItem('mtrix_demo_wishlist');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem('mtrix_demo_wishlist', JSON.stringify(wishlistItems));
        } catch (e) {
            console.error('Error saving wishlist:', e);
        }
    }, [wishlistItems]);

    useEffect(() => {
        if (user) {
            fetchWishlistItems();
        }
    }, [user]);

    const fetchWishlistItems = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('wishlist_items')
                .select(`
          id,
          product_id,
          products:product_id (
            id,
            name,
            base_price,
            discount_price
          )
        `)
                .eq('user_id', user.id);

            if (error || !data || data.length === 0) return;

            const itemsWithImages = await Promise.all(
                data.map(async (item: any) => {
                    const { data: imageData } = await supabase
                        .from('product_images')
                        .select('image_url')
                        .eq('product_id', item.product_id)
                        .eq('is_main', true)
                        .maybeSingle();

                    return {
                        id: item.id,
                        product_id: item.product_id,
                        product: {
                            ...item.products,
                            image_url: imageData?.image_url
                        }
                    };
                })
            );

            if (itemsWithImages.length > 0) {
                setWishlistItems(itemsWithImages);
            }
        } catch {
            // Silently fall back to demo wishlist
        }
    };

    const addToWishlist = async (productId: string) => {
        if (isInWishlist(productId)) return;

        const targetShowcase = SHOWCASE_PRODUCTS.find(p => p.id === productId) || SHOWCASE_PRODUCTS[0];
        const newItem: WishlistItem = {
            id: `wish-${Date.now()}`,
            product_id: targetShowcase.id,
            product: {
                id: targetShowcase.id,
                name: targetShowcase.name,
                base_price: targetShowcase.base_price,
                discount_price: targetShowcase.discount_price ?? undefined,
                image_url: targetShowcase.product_images[0]?.image_url
            }
        };

        setWishlistItems(prev => [...prev, newItem]);

        toast({
            title: "Saved to Wishlist",
            description: `${targetShowcase.name} saved to your wishlist.`
        });

        if (user) {
            try {
                await supabase.from('wishlist_items').insert({
                    user_id: user.id,
                    product_id: productId
                });
            } catch {
                // Suppress DB error in demo mode
            }
        }
    };

    const removeFromWishlist = async (itemId: string) => {
        setWishlistItems(prev => prev.filter(item => item.id !== itemId && item.product_id !== itemId));

        toast({
            title: "Removed from Wishlist",
            description: "Item removed from your wishlist."
        });

        if (user) {
            try {
                await supabase.from('wishlist_items').delete().eq('id', itemId);
            } catch {
                // Suppress DB error in demo mode
            }
        }
    };

    const isInWishlist = (productId: string) => {
        return wishlistItems.some(item => item.product_id === productId || item.id === productId);
    };

    return (
        <WishlistContext.Provider value={{ wishlistItems, loading, addToWishlist, removeFromWishlist, isInWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlistContext = () => {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlistContext must be used within a WishlistProvider');
    }
    return context;
};
