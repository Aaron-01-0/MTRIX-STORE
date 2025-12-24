import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Category = Tables<'categories'>;
// Extended Product type for the view
export interface Product extends Tables<'products'> {
    product_images?: {
        image_url: string;
        is_main: boolean;
        display_order: number;
    }[];
    image_url?: string | null;
    ratings_avg?: number;
    ratings_count?: number;
}

interface CategoryDetailData {
    category: Category;
    products: Product[];
    parentCategory: Category | null;
}

export const useCategoryDetail = (slug: string | undefined) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['category', slug],
        queryFn: async () => {
            if (!slug) throw new Error('Slug is required');

            // 1. Handle Special Collections
            if (['new-drop', 'bestsellers', 'back-in-stock'].includes(slug)) {
                return fetchCollection(slug);
            }

            // 2. Handle Standard Categories
            // a. Get Category Details
            const { data: cat, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('slug', slug)
                .single();

            if (catError || !cat) throw new Error('Category not found');

            // b. Get Parent Category if exists
            let parentCategory: Category | null = null;
            if (cat.parent_id) {
                const { data: parent } = await supabase
                    .from('categories')
                    .select('*')
                    .eq('id', cat.parent_id)
                    .single();
                parentCategory = parent;
            }

            // c. Get Products (Direct + Subcategories)
            const { data: subcats } = await supabase
                .from('categories')
                .select('id')
                .eq('parent_id', cat.id);

            const subcatIds = subcats?.map(sc => sc.id) || [];
            const allCategoryIds = [cat.id, ...subcatIds];

            const { data: prods, error: prodError } = await supabase
                .from('products')
                .select('*, product_images(image_url, is_main, display_order)')
                .in('category_id', allCategoryIds)
                .eq('status', 'published')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (prodError) throw prodError;

            return {
                category: cat,
                products: (prods || []) as unknown as Product[], // Cast to fix type mismatch with join
                parentCategory
            };
        },
        enabled: !!slug,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return {
        category: data?.category || null,
        products: data?.products || [],
        parentCategory: data?.parentCategory || null,
        loading: isLoading,
        error
    };
};

// Helper for Collections
const fetchCollection = async (type: string): Promise<CategoryDetailData> => {
    let query = supabase.from('products').select('*, product_images(image_url, is_main, display_order)').eq('status', 'published').eq('is_active', true);
    let title = '';
    let description = '';

    if (type === 'new-drop') {
        title = 'New Drops';
        description = 'The latest heat, just landed.';
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        query = query.or(`created_at.gte.${tenDaysAgo.toISOString()},is_new.eq.true,tags.cs.{new-drop}`);
        query = query.order('created_at', { ascending: false });
    } else if (type === 'bestsellers') {
        title = 'Bestsellers';
        description = 'Most wanted gear right now.';
        query = query.eq('is_trending', true);
    } else if (type === 'back-in-stock') {
        title = 'Back in Stock';
        description = 'Secured the bag. Re-up now.';
        query = query.gt('stock_quantity', 0).order('updated_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;

    // Construct fake category object for the view
    const category: Category = {
        id: type,
        name: title,
        description: description,
        slug: type,
        image_url: null,
        parent_id: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        meta_title: title,
        meta_description: description,
        display_order: 0
    };

    return {
        category,
        products: (data || []) as unknown as Product[],
        parentCategory: null
    };
};
