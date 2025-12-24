import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
    id: string;
    name: string;
    count: number;
    image_url?: string;
    description?: string;
    parent_id?: string | null;
}

export const useCategories = () => {
    const { data: categories = [], isLoading, error } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            // 1. Fetch Categories
            const { data: categoriesData, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true);

            if (catError) throw catError;

            // 2. Fetch Product Counts (for "All" count calculation)
            // Note: In a larger app, this should be a DB view or RPC
            const { data: productsData, error: prodError } = await supabase
                .from('products')
                .select('category_id')
                .eq('is_active', true);

            if (prodError) throw prodError;

            const productCounts = productsData?.reduce((acc: Record<string, number>, product) => {
                if (product.category_id) {
                    acc[product.category_id] = (acc[product.category_id] || 0) + 1;
                }
                return acc;
            }, {}) || {};

            const formattedCategories: Category[] = [
                { id: 'all', name: 'All Categories', count: productsData?.length || 0, parent_id: null },
                ...(categoriesData?.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    count: productCounts[cat.id] || 0,
                    image_url: cat.image_url,
                    description: cat.description,
                    parent_id: cat.parent_id
                })) || [])
            ];

            return formattedCategories;
        },
        staleTime: 1000 * 60 * 60, // 1 hour (categories change rarely)
    });

    return { categories, loading: isLoading, error };
};
