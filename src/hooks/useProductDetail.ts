import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductVariant } from '@/components/product/VariantSelector';
import { ProductAttribute } from '@/components/product/VariantSelector';

export interface ProductDetail {
    id: string;
    name: string;
    short_description: string | null;
    detailed_description: string | null;
    base_price: number;
    discount_price: number | null;
    sku: string;
    stock_quantity: number;
    stock_status: string;
    minimum_order_quantity: number;
    weight: number | null;
    dimensions: any;
    return_policy: string | null;
    warranty_info: string | null;
    ratings_avg: number;
    ratings_count: number;
    is_active: boolean;
    is_new: boolean;
    is_trending: boolean;
    is_featured: boolean;
    has_variants: boolean;
    variant_type: string;
    categories: { id: string; name: string } | null;
    brands: { name: string } | null;
    product_images: Array<{
        image_url: string;
        alt_text: string | null;
        is_main: boolean;
        display_order: number;
    }> | null;
    category_id: string | null;
}

export const useProductDetail = (id: string | undefined) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['product', id],
        queryFn: async () => {
            if (!id) throw new Error('Product ID is required');

            // Validate UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(id)) {
                throw new Error('Invalid Product ID format');
            }

            // 1. Fetch Product, Attributes, and Variants in parallel
            const [productRes, attributesRes, variantsRes] = await Promise.all([
                supabase
                    .from('products')
                    .select(`
            *,
            categories(id, name),
            brands(name),
            product_images(image_url, alt_text, is_main, display_order)
          `)
                    .eq('id', id)
                    .eq('is_active', true)
                    .single(),

                supabase
                    .from('product_attributes')
                    .select('*, attribute_values(*)')
                    .eq('product_id', id)
                    .order('display_order'),

                supabase
                    .from('product_variants')
                    .select('*')
                    .eq('product_id', id)
                    .eq('is_active', true)
            ]);

            if (productRes.error) throw productRes.error;

            return {
                product: productRes.data as unknown as ProductDetail,
                attributes: (attributesRes.data || []) as unknown as ProductAttribute[],
                variants: (variantsRes.data || []) as unknown as ProductVariant[]
            };
        },
        enabled: !!id && id !== ':id',
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return {
        product: data?.product || null,
        attributes: data?.attributes || [],
        variants: data?.variants || [],
        loading: isLoading,
        error
    };
};
