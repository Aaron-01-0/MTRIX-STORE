import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductVariant, ProductAttribute } from '@/types/supabase-ext'; // Assuming we can import or redefine locally if types not exported perfectly

// Re-defining interface locally to match Component usage if needed, or better, export from component?
// Ideally types should be in types/supabase-ext.ts.
// Let's assume standard types for now and allow 'any' for transformation if strict types aren't fully set up globally.

export const useProductVariants = (productId: string) => {
    return useQuery({
        queryKey: ['variants', productId],
        queryFn: async () => {
            // Fetch product details, attributes, and variants in parallel
            const [productRes, attributesRes, variantsRes] = await Promise.all([
                supabase.from('products').select('category:categories(name)').eq('id', productId).single(),
                supabase.from('product_attributes').select('*, attribute_values(*)').eq('product_id', productId).order('display_order'),
                supabase.from('product_variants').select('*').eq('product_id', productId).order('created_at', { ascending: true })
            ]);

            if (productRes.error) throw productRes.error;
            if (attributesRes.error) throw attributesRes.error;
            if (variantsRes.error) throw variantsRes.error;

            // Transform variants to match component expectation (adding absolute_price fallback)
            const formattedVariants = (variantsRes.data || []).map((item: any) => ({
                ...item,
                absolute_price: item.price || item.absolute_price || 0
            }));

            return {
                // @ts-ignore
                category: productRes.data?.category?.name || '',
                attributes: attributesRes.data || [],
                variants: formattedVariants
            };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!productId,
    });
};
