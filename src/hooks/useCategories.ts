import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SHOWCASE_CATEGORIES, SHOWCASE_PRODUCTS } from '@/data/mockData';

export interface Category {
    id: string;
    name: string;
    slug: string;
    count: number;
    image_url?: string;
    description?: string;
    parent_id?: string | null;
}

const getFallbackCategories = (): Category[] => [
    { id: 'all', name: 'All Categories', slug: 'all', count: SHOWCASE_PRODUCTS.length, parent_id: null },
    ...SHOWCASE_CATEGORIES.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        count: c.count,
        description: c.description,
        parent_id: null
    }))
];

export const useCategories = () => {
    const { data: categories = [], isLoading, error } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            try {
                const { data: categoriesData, error: catError } = await supabase
                    .from('categories')
                    .select('*')
                    .eq('is_active', true);

                if (catError || !categoriesData || categoriesData.length === 0) {
                    return getFallbackCategories();
                }

                const { data: productsData } = await supabase
                    .from('products')
                    .select('category_id')
                    .eq('is_active', true);

                const productCounts = productsData?.reduce((acc: Record<string, number>, product) => {
                    if (product.category_id) {
                        acc[product.category_id] = (acc[product.category_id] || 0) + 1;
                    }
                    return acc;
                }, {}) || {};

                return [
                    { id: 'all', name: 'All Categories', slug: 'all', count: productsData?.length || categoriesData.length, parent_id: null },
                    ...categoriesData.map(cat => ({
                        id: cat.id,
                        name: cat.name,
                        slug: cat.slug,
                        count: productCounts[cat.id] || 1,
                        image_url: cat.image_url,
                        description: cat.description,
                        parent_id: cat.parent_id
                    }))
                ];
            } catch {
                return getFallbackCategories();
            }
        },
        staleTime: 1000 * 60 * 60,
    });

    return { categories, loading: isLoading, error: null };
};
