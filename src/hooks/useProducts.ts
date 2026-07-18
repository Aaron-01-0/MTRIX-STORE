import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SHOWCASE_PRODUCTS } from '@/data/mockData';

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
  stock_quantity: number;
  categories: { name: string } | null;
  brands: { name: string } | null;
  product_images: Array<{ image_url: string; thumbnail_url?: string | null; is_main: boolean; display_order: number }> | null;
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
  thumbnail?: string;
}

// Helper to format product data
const formatProduct = (product: DatabaseProduct): Product => {
  const mainImgObj = product.product_images?.find(img => img.is_main);
  const firstImgObj = product.product_images?.sort((a, b) => a.display_order - b.display_order)[0];

  const mainImage = mainImgObj?.image_url;
  const firstImage = firstImgObj?.image_url;
  const thumbnail = mainImgObj?.thumbnail_url || firstImgObj?.thumbnail_url;

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
    stockStatus: product.stock_quantity === 0 ? 'out_of_stock' : product.stock_status,
    thumbnail: thumbnail || (mainImage || firstImage),
  };
};

const getFallbackProducts = () => SHOWCASE_PRODUCTS.map(p => ({
  id: p.id,
  name: p.name,
  price: `₹${(p.discount_price ?? p.base_price).toLocaleString()}`,
  originalPrice: p.discount_price ? `₹${p.base_price.toLocaleString()}` : undefined,
  image: p.product_images[0]?.image_url || "/api/placeholder/300/300",
  rating: p.ratings_avg,
  isNew: p.is_new,
  isTrending: p.is_trending,
  category: p.categories.name,
  brand: p.brands.name,
  stockStatus: p.stock_status,
  thumbnail: p.product_images[0]?.image_url
}));

export const useProducts = () => {
  const { data: products = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            categories(name),
            brands(name),
            product_images(image_url, thumbnail_url, is_main, display_order)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
          return getFallbackProducts();
        }

        return (data as unknown as DatabaseProduct[]).map(formatProduct);
      } catch {
        return getFallbackProducts();
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    products,
    loading,
    error: null,
    refetch,
  };
};

export const useFeaturedProducts = () => {
  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            categories(name),
            brands(name),
            product_images(image_url, thumbnail_url, is_main, display_order)
          `)
          .eq('is_active', true)
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(12);

        if (error || !data || data.length === 0) {
          return getFallbackProducts().filter(p => p.isNew || p.isTrending);
        }

        return (data as unknown as DatabaseProduct[]).map(formatProduct);
      } catch {
        return getFallbackProducts().filter(p => p.isNew || p.isTrending);
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  return { products, loading };
};

export const useTrendingProducts = () => {
  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: ['products', 'trending'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            categories(name),
            brands(name),
            product_images(image_url, thumbnail_url, is_main, display_order)
          `)
          .eq('is_active', true)
          .eq('is_trending', true)
          .order('created_at', { ascending: false })
          .limit(12);

        if (error || !data || data.length === 0) {
          return getFallbackProducts().filter(p => p.isTrending);
        }

        return (data as unknown as DatabaseProduct[]).map(formatProduct);
      } catch {
        return getFallbackProducts().filter(p => p.isTrending);
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  return { products, loading };
};