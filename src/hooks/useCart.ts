import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  variant_id?: string;
  bundle_id?: string;
  product: {
    id: string;
    name: string;
    base_price: number;
    discount_price?: number;
    image_url?: string;
    stock_quantity: number;
  };
  bundle?: {
    id: string;
    name: string;
    price_value: number;
    price_type: string;
  };
}

export const useCart = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCartItems();
      subscribeToCartChanges();
    } else {
      setCartItems([]);
      setLoading(false);
    }
  }, [user]);

  const fetchCartItems = async () => {
    if (!user) return;

    try {
      const { data: cartRows, error } = await supabase
        .from('cart_items')
        .select('id, product_id, quantity, variant_id, bundle_id')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!cartRows || cartRows.length === 0) {
        setCartItems([]);
        return;
      }

      const productIds = Array.from(new Set(cartRows.map((i: any) => i.product_id)));
      const variantIds = Array.from(new Set(cartRows.map((i: any) => i.variant_id).filter(Boolean)));
      const bundleIds = Array.from(new Set(cartRows.map((i: any) => i.bundle_id).filter(Boolean)));

      const [productsRes, imagesRes, variantsRes, bundlesRes] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, base_price, discount_price, stock_quantity')
          .in('id', productIds),
        supabase
          .from('product_images')
          .select('product_id, image_url, is_main')
          .in('product_id', productIds)
          .eq('is_main', true),
        variantIds.length > 0
          ? supabase
            .from('product_variants')
            .select('id, stock_quantity, absolute_price, image_url')
            .in('id', variantIds)
          : Promise.resolve({ data: [] }),
        bundleIds.length > 0
          ? supabase
            .from('bundles')
            .select('id, name, price_value, price_type')
            .in('id', bundleIds)
          : Promise.resolve({ data: [] })
      ]);

      const productsData = productsRes.data || [];
      const imagesData = imagesRes.data || [];
      const variantsData = variantsRes.data || [];
      const bundlesData = bundlesRes.data || [];

      const productMap = new Map(productsData.map((p: any) => [p.id, p]));
      const imageMap = new Map(imagesData.map((img: any) => [img.product_id, img.image_url]));
      const variantMap = new Map(variantsData.map((v: any) => [v.id, v]));
      const bundleMap = new Map(bundlesData.map((b: any) => [b.id, b]));

      const itemsWithData: CartItem[] = cartRows
        .map((item: any) => {
          const p = productMap.get(item.product_id);
          if (!p) return null;

          let stockQuantity = p.stock_quantity;
          let price = p.base_price;
          let imageUrl = imageMap.get(item.product_id);

          if (item.variant_id) {
            const v = variantMap.get(item.variant_id);
            if (v) {
              stockQuantity = v.stock_quantity;
              if (v.absolute_price) price = v.absolute_price;
              if (v.image_url) imageUrl = v.image_url;
            }
          }

          return {
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            variant_id: item.variant_id,
            bundle_id: item.bundle_id,
            product: {
              id: p.id,
              name: p.name,
              base_price: price,
              discount_price: p.discount_price,
              stock_quantity: stockQuantity,
              image_url: imageUrl,
            },
            bundle: item.bundle_id ? bundleMap.get(item.bundle_id) : undefined
          } as CartItem;
        })
        .filter(Boolean) as CartItem[];

      setCartItems(itemsWithData);
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      toast({
        title: "Error",
        description: "Failed to load cart items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToCartChanges = () => {
    const channel = supabase
      .channel('cart-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchCartItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const addToCart = async (productId: string, quantity: number = 1, variantId?: string, bundleId?: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add items to cart",
        variant: "destructive"
      });
      return;
    }

    try {
      // Validate stock availability
      if (variantId) {
        const { data: variant, error: variantError } = await supabase
          .from('product_variants')
          .select('stock_quantity')
          .eq('id', variantId)
          .single();

        if (variantError) throw variantError;

        if (variant.stock_quantity < quantity) {
          toast({
            title: "Insufficient Stock",
            description: `Only ${variant.stock_quantity} units available`,
            variant: "destructive"
          });
          return;
        }
      } else {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', productId)
          .single();

        if (productError) throw productError;

        if (product.stock_quantity < quantity) {
          toast({
            title: "Insufficient Stock",
            description: `Only ${product.stock_quantity} units available`,
            variant: "destructive"
          });
          return;
        }
      }

      if (bundleId) {
        await supabase.from('cart_items').insert({
          user_id: user.id,
          product_id: productId,
          quantity,
          variant_id: variantId || null,
          bundle_id: bundleId
        });
      } else {
        await supabase.from('cart_items').upsert({
          user_id: user.id,
          product_id: productId,
          quantity,
          variant_id: variantId || null,
          bundle_id: null
        }, {
          onConflict: 'user_id,product_id,variant_id'
        });
      }

      toast({
        title: "Success",
        description: bundleId ? "Bundle item added" : "Item added to cart"
      });
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart",
        variant: "destructive"
      });
    }
  };

  const addBundleToCart = async (bundleId: string, items: { product_id: string; variant_id?: string; quantity: number }[]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add bundles",
        variant: "destructive"
      });
      return;
    }

    try {
      const cartInserts = items.map(item => ({
        user_id: user.id,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: item.quantity,
        bundle_id: bundleId
      }));

      const { error } = await supabase.from('cart_items').insert(cartInserts);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Bundle added to cart"
      });
      fetchCartItems();
    } catch (error: any) {
      console.error('Error adding bundle:', error);
      toast({
        title: "Error",
        description: "Failed to add bundle to cart",
        variant: "destructive"
      });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;

    const previousItems = [...cartItems];
    setCartItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    ));

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      setCartItems(previousItems);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive"
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        fetchCartItems();
        throw error;
      }
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive"
      });
    }
  };

  const clearCart = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);
      if (error) throw error;
      setCartItems([]);
    } catch (error: any) {
      console.error('Error clearing cart:', error);
    }
  };

  return {
    cartItems,
    loading,
    addToCart,
    addBundleToCart,
    updateQuantity,
    removeFromCart,
    clearCart
  };
};
