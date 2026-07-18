import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SHOWCASE_PRODUCTS } from '@/data/mockData';

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
    category_id?: string;
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
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('mtrix_demo_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('mtrix_demo_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Error saving cart to local storage:', e);
    }
  }, [cartItems]);

  useEffect(() => {
    if (user) {
      fetchCartItems();
    }
  }, [user]);

  const fetchCartItems = async () => {
    if (!user) return;

    try {
      const { data: cartRows, error } = await supabase
        .from('cart_items')
        .select('id, product_id, quantity, variant_id, bundle_id')
        .eq('user_id', user.id);

      if (error || !cartRows || cartRows.length === 0) return;

      const productIds = Array.from(new Set(cartRows.map((i: any) => i.product_id)));

      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, base_price, discount_price, stock_quantity, category_id')
        .in('id', productIds);

      const { data: imagesData } = await supabase
        .from('product_images')
        .select('product_id, image_url, is_main')
        .in('product_id', productIds)
        .eq('is_main', true);

      const productMap = new Map((productsData || []).map((p: any) => [p.id, p]));
      const imageMap = new Map((imagesData || []).map((img: any) => [img.product_id, img.image_url]));

      const itemsWithData: CartItem[] = cartRows
        .map((item: any) => {
          const p = productMap.get(item.product_id);
          if (!p) return null;

          return {
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            variant_id: item.variant_id,
            bundle_id: item.bundle_id,
            product: {
              id: p.id,
              name: p.name,
              base_price: p.base_price,
              discount_price: p.discount_price,
              stock_quantity: p.stock_quantity,
              image_url: imageMap.get(item.product_id),
              category_id: p.category_id,
            }
          } as CartItem;
        })
        .filter(Boolean) as CartItem[];

      if (itemsWithData.length > 0) {
        setCartItems(itemsWithData);
      }
    } catch {
      // Silently fall back to demo cart
    }
  };

  const addToCart = async (productId: string, quantity: number = 1, variantId?: string, bundleId?: string) => {
    // Local Demo Cart Fallback
    const targetShowcaseProduct = SHOWCASE_PRODUCTS.find(p => p.id === productId) || SHOWCASE_PRODUCTS[0];

    setCartItems(prev => {
      const existingIndex = prev.findIndex(i => i.product_id === productId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return updated;
      } else {
        const newItem: CartItem = {
          id: `item-${Date.now()}`,
          product_id: targetShowcaseProduct.id,
          quantity,
          variant_id: variantId,
          bundle_id: bundleId,
          product: {
            id: targetShowcaseProduct.id,
            name: targetShowcaseProduct.name,
            base_price: targetShowcaseProduct.base_price,
            discount_price: targetShowcaseProduct.discount_price ?? undefined,
            image_url: targetShowcaseProduct.product_images[0]?.image_url,
            stock_quantity: targetShowcaseProduct.stock_quantity,
            category_id: targetShowcaseProduct.category_id
          }
        };
        return [...prev, newItem];
      }
    });

    toast({
      title: "Added to Cart!",
      description: `${quantity}x ${targetShowcaseProduct.name} added to your cart.`
    });

    if (user) {
      try {
        await supabase.from('cart_items').upsert({
          user_id: user.id,
          product_id: productId,
          quantity,
          variant_id: variantId || null,
          bundle_id: bundleId || null
        }, { onConflict: 'user_id,product_id,variant_id' });
      } catch {
        // Suppress DB error in demo mode
      }
    }
  };

  const addBundleToCart = async (bundleId: string, items: { product_id: string; variant_id?: string; quantity: number }[]) => {
    items.forEach(item => {
      if (item.product_id) {
        addToCart(item.product_id, item.quantity, item.variant_id, bundleId);
      }
    });
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;

    setCartItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    ));

    if (user) {
      try {
        await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('id', itemId);
      } catch {
        // Suppress DB error in demo mode
      }
    }
  };

  const removeFromCart = async (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));

    toast({
      title: "Removed from Cart",
      description: "Item has been removed from your cart."
    });

    if (user) {
      try {
        await supabase.from('cart_items').delete().eq('id', itemId);
      } catch {
        // Suppress DB error in demo mode
      }
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    localStorage.removeItem('mtrix_demo_cart');
    if (user) {
      try {
        await supabase.from('cart_items').delete().eq('user_id', user.id);
      } catch {
        // Suppress DB error in demo mode
      }
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
