import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { OptimizedImage } from "@/components/OptimizedImage";

interface Product {
    id: string;
    name: string;
    base_price: number;
    discount_price: number | null;
    image_url: string | null;
    category_id: string;
}

const FeaturedGrid = () => {
    const { addToCart } = useCart();
    const { toast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            // Fetch featured products with their main image in a single query
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
                .limit(8);

            if (error) throw error;

            // Transform data to flatten the image_url
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

    return (
        <section className="py-20 bg-mtrix-dark">
            <div className="container mx-auto px-6">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-2">
                            Featured <span className="text-primary">Gear</span>
                        </h2>
                        <p className="text-muted-foreground">Curated essentials for your setup.</p>
                    </div>
                    <Link to="/catalog">
                        <Button variant="link" className="text-primary hover:text-primary/80">
                            View All Products
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <Link key={product.id} to={`/product/${product.id}`} className="group">
                            <Card className="bg-mtrix-black border-mtrix-gray overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                                <div className="relative aspect-square overflow-hidden bg-mtrix-dark">
                                    <OptimizedImage
                                        src={product.image_url || '/placeholder.svg'}
                                        alt={product.name}
                                        aspectRatio="square"
                                        preset="card"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />

                                    {/* Quick Actions */}
                                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-4 group-hover:translate-x-0">
                                        <Button size="icon" variant="secondary" className="rounded-full bg-mtrix-black/80 hover:bg-primary hover:text-black backdrop-blur-sm">
                                            <Heart className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className="rounded-full bg-mtrix-black/80 hover:bg-primary hover:text-black backdrop-blur-sm"
                                            onClick={(e) => handleAddToCart(e, product)}
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {product.discount_price && (
                                        <div className="absolute top-4 left-4 bg-primary text-black text-xs font-bold px-2 py-1 rounded">
                                            SALE
                                        </div>
                                    )}
                                </div>

                                <CardContent className="p-4">
                                    <h3 className="font-semibold text-white mb-2 truncate group-hover:text-primary transition-colors">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-primary">
                                            ₹{product.discount_price || product.base_price}
                                        </span>
                                        {product.discount_price && (
                                            <span className="text-sm text-muted-foreground line-through">
                                                ₹{product.base_price}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedGrid;
