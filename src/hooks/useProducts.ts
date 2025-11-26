import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DatabaseProduct {
  id: string;
  name: string;
  short_description: string | null;
  detailed_description: string | null;
  base_price: number;
  discount_price: number | null;
  currency: string;
  ratings_avg: number;
  ratings_count: number;
  is_active: boolean;
  is_new: boolean;
  is_trending: boolean;
  is_featured: boolean;
  stock_status: string;
  categories: { name: string } | null;
  brands: { name: string } | null;
  product_images: Array<{ image_url: string; is_main: boolean; display_order: number }> | null;
}

export interface Product {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  rating: number;
  isNew?: boolean;
  isTrending?: boolean;
  category?: string;
  brand?: string;
  stockStatus?: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          brands(name),
          product_images(image_url, is_main, display_order)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedProducts: Product[] = (data as DatabaseProduct[])?.map((product) => {
        // Get the main image or the first image
        const mainImage = product.product_images?.find(img => img.is_main)?.image_url;
        const firstImage = product.product_images?.sort((a, b) => a.display_order - b.display_order)[0]?.image_url;
        
        return {
          id: product.id,
          name: product.name,
          price: product.discount_price 
            ? `₹${product.discount_price.toFixed(0)}`
            : `₹${product.base_price.toFixed(0)}`,
          originalPrice: product.discount_price 
            ? `₹${product.base_price.toFixed(0)}`
            : undefined,
          image: mainImage || firstImage || "/api/placeholder/300/300",
          rating: product.ratings_avg || 0,
          isNew: product.is_new,
          isTrending: product.is_trending,
          category: product.categories?.name,
          brand: product.brands?.name,
          stockStatus: product.stock_status,
        };
      }) || [];

      setProducts(formattedProducts);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  };
};

export const useFeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            categories(name),
            brands(name),
            product_images(image_url, is_main, display_order)
          `)
          .eq('is_active', true)
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(12);

        if (error) throw error;

        const formattedProducts: Product[] = (data as DatabaseProduct[])?.map((product) => {
          const mainImage = product.product_images?.find(img => img.is_main)?.image_url;
          const firstImage = product.product_images?.sort((a, b) => a.display_order - b.display_order)[0]?.image_url;
          
          return {
            id: product.id,
            name: product.name,
            price: product.discount_price 
              ? `₹${product.discount_price.toFixed(0)}`
              : `₹${product.base_price.toFixed(0)}`,
            originalPrice: product.discount_price 
              ? `₹${product.base_price.toFixed(0)}`
              : undefined,
            image: mainImage || firstImage || "/api/placeholder/300/300",
            rating: product.ratings_avg || 0,
            isNew: product.is_new,
            isTrending: product.is_trending,
            category: product.categories?.name,
            brand: product.brands?.name,
            stockStatus: product.stock_status,
          };
        }) || [];

        setProducts(formattedProducts);
      } catch (err) {
        console.error('Error fetching featured products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  return { products, loading };
};

export const useTrendingProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            categories(name),
            brands(name),
            product_images(image_url, is_main, display_order)
          `)
          .eq('is_active', true)
          .eq('is_trending', true)
          .order('created_at', { ascending: false })
          .limit(12);

        if (error) throw error;

        const formattedProducts: Product[] = (data as DatabaseProduct[])?.map((product) => {
          const mainImage = product.product_images?.find(img => img.is_main)?.image_url;
          const firstImage = product.product_images?.sort((a, b) => a.display_order - b.display_order)[0]?.image_url;
          
          return {
            id: product.id,
            name: product.name,
            price: product.discount_price 
              ? `₹${product.discount_price.toFixed(0)}`
              : `₹${product.base_price.toFixed(0)}`,
            originalPrice: product.discount_price 
              ? `₹${product.base_price.toFixed(0)}`
              : undefined,
            image: mainImage || firstImage || "/api/placeholder/300/300",
            rating: product.ratings_avg || 0,
            isNew: product.is_new,
            isTrending: product.is_trending,
            category: product.categories?.name,
            brand: product.brands?.name,
            stockStatus: product.stock_status,
          };
        }) || [];

        setProducts(formattedProducts);
      } catch (err) {
        console.error('Error fetching trending products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingProducts();
  }, []);

  return { products, loading };
};