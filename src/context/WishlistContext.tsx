import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchWishlistItems();
            const unsubscribe = subscribeToWishlistChanges();
            return () => {
                unsubscribe();
            };
        } else {
            setWishlistItems([]);
            setLoading(false);
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

            if (error) throw error;

            // Fetch product images
            const itemsWithImages = await Promise.all(
                (data || []).map(async (item: any) => {
                    const { data: imageData } = await supabase
                        .from('product_images')
                        .select('image_url')
                        .eq('product_id', item.product_id)
                        .eq('is_main', true)
                        .single();

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

            setWishlistItems(itemsWithImages);
        } catch (error: any) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToWishlistChanges = () => {
        const channel = supabase
            .channel('wishlist-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'wishlist_items',
                    filter: `user_id=eq.${user?.id}`
                },
                () => {
                    fetchWishlistItems();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const addToWishlist = async (productId: string) => {
        if (!user) {
            toast({
                title: "Authentication Required",
                description: "Please sign in to add items to wishlist",
                variant: "destructive"
            });
            return;
        }

        // Check if already in wishlist to prevent duplicates
        if (isInWishlist(productId)) return;

        // Optimistic update
        const tempId = crypto.randomUUID();
        const tempItem: WishlistItem = {
            id: tempId,
            product_id: productId,
            product: {
                id: productId,
                name: '', // Placeholder
                base_price: 0
            }
        };

        setWishlistItems(prev => [...prev, tempItem]);

        try {
            const { error } = await supabase
                .from('wishlist_items')
                .insert({
                    user_id: user.id,
                    product_id: productId
                });

            if (error) throw error;

            toast({
                title: "Success",
                description: "Item added to wishlist"
            });
            // Subscription will trigger refresh and replace temp item with real one
        } catch (error: any) {
            console.error('Error adding to wishlist:', error);
            // Rollback
            setWishlistItems(prev => prev.filter(item => item.id !== tempId));
            toast({
                title: "Error",
                description: error.message || "Failed to add item to wishlist",
                variant: "destructive"
            });
        }
    };

    const removeFromWishlist = async (itemId: string) => {
        // Optimistic update
        const previousItems = [...wishlistItems];
        setWishlistItems(prev => prev.filter(item => item.id !== itemId));

        try {
            const { error } = await supabase
                .from('wishlist_items')
                .delete()
                .eq('id', itemId);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Item removed from wishlist"
            });
        } catch (error: any) {
            console.error('Error removing from wishlist:', error);
            // Rollback
            setWishlistItems(previousItems);
            toast({
                title: "Error",
                description: "Failed to remove item",
                variant: "destructive"
            });
        }
    };

    const isInWishlist = (productId: string) => {
        return wishlistItems.some(item => item.product_id === productId);
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
