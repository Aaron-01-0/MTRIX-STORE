import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Product {
    id: string;
    name: string;
    base_price: number;
    discount_price: number | null;
    image_url: string | null;
    category_id: string;
}

const ProductBentoGrid = () => {
    const { addToCart } = useCart();
    const { toast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    id, 
                    name, 
                    base_price, 
                    discount_price, 
                    category_id,
                    product_images (
                        image_url
                    )
                `)
                .eq('is_featured', true)
                .eq('is_active', true)
                .eq('product_images.is_main', true)
                .limit(5); // We need exactly 5 for the bento layout

            if (error) throw error;

            const productsWithImages = (data || []).map((product: any) => ({
                ...product,
                image_url: product.product_images?.[0]?.image_url || null
            }));

            setProducts(productsWithImages);
        } catch (error) {
            console.error('Error fetching featured products:', error);
        }
    };

    const handleAddToCart = (e: React.MouseEvent, product: Product) => {
        e.preventDefault();
        addToCart(product.id, 1);
        toast({
            title: "Added to Cart",
            description: `${product.name} has been added to your cart.`,
        });
    };

    if (products.length === 0) return null;

    return (
        <section className="py-24 bg-mtrix-dark">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-4">
                            FEATURED <span className="text-primary">GEAR</span>
                        </h2>
                        <p className="text-muted-foreground text-lg">Essentials for the modern setup.</p>
                    </div>
                    <Link to="/catalog">
                        <Button variant="link" className="text-primary hover:text-primary/80 text-lg p-0 h-auto">
                            View All Products <ArrowUpRight className="w-5 h-5 ml-1" />
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-[800px] md:h-[600px]">
                    {products.map((product, index) => (
                        <Link
                            key={product.id}
                            to={`/product/${product.id}`}
                            className={cn(
                                "group relative overflow-hidden rounded-2xl border border-white/5 bg-black/40 hover:border-primary/50 transition-all duration-500",
                                index === 0 ? "md:col-span-2 md:row-span-2" : // Large item
                                    index === 1 ? "md:col-span-2 md:row-span-1" : // Wide item
                                        "md:col-span-1 md:row-span-1" // Standard items
                            )}
                        >
                            {/* Image */}
                            <div className="absolute inset-0">
                                <img
                                    src={product.image_url || '/placeholder.svg'}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                            </div>

                            {/* Badges */}
                            {product.discount_price && (
                                <div className="absolute top-4 left-4 bg-primary text-black text-xs font-bold px-3 py-1 rounded-full">
                                    SALE
                                </div>
                            )}

                            {/* Actions */}
                            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                <Button size="icon" variant="secondary" className="rounded-full bg-black/50 hover:bg-primary hover:text-black backdrop-blur-md border border-white/10">
                                    <Heart className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="rounded-full bg-black/50 hover:bg-primary hover:text-black backdrop-blur-md border border-white/10"
                                    onClick={(e) => handleAddToCart(e, product)}
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="absolute bottom-0 left-0 p-6 w-full">
                                <h3 className={cn(
                                    "font-orbitron font-bold text-white mb-2 group-hover:text-primary transition-colors",
                                    index === 0 ? "text-3xl" : "text-xl"
                                )}>
                                    {product.name}
                                </h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-xl font-bold text-white">
                                        ₹{product.discount_price || product.base_price}
                                    </span>
                                    {product.discount_price && (
                                        <span className="text-sm text-muted-foreground line-through">
                                            ₹{product.base_price}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProductBentoGrid;
