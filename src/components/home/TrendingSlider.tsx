import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { useTrendingProducts, Product } from '@/hooks/useProducts';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

const TrendingSlider = () => {
    const { addToCart } = useCart();
    const { toast } = useToast();
    const { products, loading } = useTrendingProducts();

    // Use derived state if needed or just use products directly
    // The hook returns formatted products, but this component expects specific shape?
    // Let's check the hook output vs component expectation.
    // Hook returns 'Product' interface. Component defines local 'Product' interface.
    // They might perform mapping.

    // The hook returns: { id, name, price, originalPrice, image, ... }
    // The component expects: { id, name, base_price, discount_price, image_url, category_id }

    // I need to map the hook's output to the component's expected format OR update the component to use the hook's format.
    // Updating component to use shared type is better.

    // However, for minimal friction, I will map it here if necessary, or better yet, Import the shared type.


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
        <section className="py-20 bg-mtrix-black border-y border-mtrix-gray">
            <div className="container mx-auto px-6">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-2">
                            Trending <span className="text-primary">Now</span>
                        </h2>
                        <p className="text-muted-foreground">What everyone else is copping.</p>
                    </div>
                </div>

                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-4">
                        {products.map((product) => (
                            <CarouselItem key={product.id} className="pl-4 md:basis-1/2 lg:basis-1/4">
                                <Link to={`/product/${product.id}`} className="group block h-full">
                                    <Card className="bg-mtrix-dark border-mtrix-gray h-full overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_-5px_rgba(var(--primary-rgb),0.3)]">
                                        <div className="relative aspect-[4/5] overflow-hidden bg-mtrix-black">
                                            <img
                                                src={product.image || '/placeholder.svg'}
                                                alt={product.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />

                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                                                <Button
                                                    size="icon"
                                                    className="rounded-full bg-white text-black hover:bg-primary hover:text-black transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75"
                                                    onClick={(e) => handleAddToCart(e, product)}
                                                >
                                                    <ShoppingCart className="w-5 h-5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="rounded-full bg-white/20 text-white hover:bg-white hover:text-black backdrop-blur-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100"
                                                >
                                                    <Heart className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>

                                        <CardContent className="p-4">
                                            <h3 className="font-semibold text-white mb-1 truncate group-hover:text-primary transition-colors">
                                                {product.name}
                                            </h3>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-bold text-primary">
                                                        {product.price}
                                                    </span>
                                                    {product.originalPrice && (
                                                        <span className="text-sm text-muted-foreground line-through">
                                                            {product.originalPrice}
                                                        </span>
                                                    )}
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transform -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden md:flex -left-12 bg-mtrix-dark border-mtrix-gray text-white hover:bg-primary hover:text-black" />
                    <CarouselNext className="hidden md:flex -right-12 bg-mtrix-dark border-mtrix-gray text-white hover:bg-primary hover:text-black" />
                </Carousel>
            </div>
        </section>
    );
};

export default TrendingSlider;
