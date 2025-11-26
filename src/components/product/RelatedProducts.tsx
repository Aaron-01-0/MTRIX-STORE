import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

interface RelatedProductsProps {
    categoryId: string;
    currentProductId: string;
}

const RelatedProducts = ({ categoryId, currentProductId }: RelatedProductsProps) => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelated = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select(`
            id, 
            name, 
            base_price, 
            discount_price, 
            ratings_avg,
            is_new,
            is_trending,
            stock_status,
            product_images(image_url, is_main)
          `)
                    .eq('category_id', categoryId)
                    .neq('id', currentProductId)
                    .eq('is_active', true)
                    .limit(4);

                if (error) throw error;
                setProducts(data || []);
            } catch (error) {
                console.error('Error fetching related products:', error);
            } finally {
                setLoading(false);
            }
        };

        if (categoryId) {
            fetchRelated();
        }
    }, [categoryId, currentProductId]);

    if (loading) {
        return (
            <div className="mt-24">
                <h2 className="text-2xl font-orbitron font-bold text-white mb-8">You May Also Like</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="h-[300px] w-full rounded-xl bg-white/5" />
                            <Skeleton className="h-4 w-2/3 bg-white/5" />
                            <Skeleton className="h-4 w-1/2 bg-white/5" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (products.length === 0) return null;

    return (
        <div className="mt-24">
            <h2 className="text-2xl font-orbitron font-bold text-white mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        id={product.id}
                        name={product.name}
                        price={`₹${product.discount_price || product.base_price}`}
                        originalPrice={product.discount_price ? `₹${product.base_price}` : undefined}
                        image={product.product_images?.find((img: any) => img.is_main)?.image_url || product.product_images?.[0]?.image_url || '/placeholder.png'}
                        rating={product.ratings_avg || 0}
                        isNew={product.is_new}
                        isTrending={product.is_trending}
                        stockStatus={product.stock_status}
                    />
                ))}
            </div>
        </div>
    );
};

export default RelatedProducts;
