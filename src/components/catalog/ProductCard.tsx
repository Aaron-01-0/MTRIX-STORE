import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { OptimizedImage } from "@/components/OptimizedImage";

interface ProductCardProps {
    product: {
        id: string;
        name: string;
        price: string;
        originalPrice?: string;
        image: string;
        rating: number;
        stockStatus: 'in_stock' | 'out_of_stock' | 'low_stock';
        isNew?: boolean;
        isTrending?: boolean;
        category?: string;
    };
    viewMode?: 'grid' | 'list';
}

const ProductCard = ({ product, viewMode = 'grid' }: ProductCardProps) => {
    const navigate = useNavigate();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const { addToCart } = useCart();
    const { toast } = useToast();
    const isOutOfStock = product.stockStatus === 'out_of_stock';
    const isInWishlistState = isInWishlist(product.id);

    // Optimized handleWishlist that gets fresh state
    const { wishlistItems } = useWishlist();
    const toggleWishlist = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const wishlistItem = wishlistItems.find(item => item.product_id === product.id);
        if (wishlistItem) {
            await removeFromWishlist(wishlistItem.id);
        } else {
            await addToWishlist(product.id);
        }
    };

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOutOfStock) return;

        try {
            await addToCart(product.id, 1);
            toast({
                title: "Added to Cart",
                description: `${product.name} has been added to your cart.`,
            });
        } catch (error) {
            console.error("Error adding to cart:", error);
            toast({
                title: "Error",
                description: "Failed to add item to cart.",
                variant: "destructive",
            });
        }
    };

    return (
        <Card
            className={`group relative bg-mtrix-dark border-mtrix-gray overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_-5px_rgba(var(--primary-rgb),0.2)] cursor-pointer ${viewMode === 'list' ? 'flex flex-row h-48' : 'h-full'
                } ${isOutOfStock ? 'opacity-75 grayscale' : ''}`}
            onClick={() => navigate(`/product/${product.id}`)}
        >
            {/* Image Container */}
            <div className={`relative overflow-hidden bg-black/50 ${viewMode === 'list' ? 'w-48 shrink-0' : 'aspect-[4/5]'}`}>
                <OptimizedImage
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                    {isOutOfStock && (
                        <Badge variant="destructive" className="font-orbitron tracking-wider">OUT OF STOCK</Badge>
                    )}
                    {!isOutOfStock && product.isNew && (
                        <Badge className="bg-primary text-black font-bold font-orbitron">NEW DROP</Badge>
                    )}
                    {!isOutOfStock && product.isTrending && (
                        <Badge className="bg-orange-500 text-white font-orbitron">HOT</Badge>
                    )}
                </div>

                {/* Quick Actions (Grid Mode) */}
                {viewMode === 'grid' && (
                    <div className="absolute bottom-4 left-0 right-0 px-4 flex gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                        <Button
                            className="flex-1 bg-white text-black hover:bg-primary hover:text-black font-bold"
                            disabled={isOutOfStock}
                            onClick={handleAddToCart}
                        >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                        </Button>
                        <Button
                            size="icon"
                            variant="secondary"
                            className={`backdrop-blur-md hover:bg-white hover:text-black ${isInWishlistState
                                ? 'bg-primary text-black'
                                : 'bg-white/20 text-white'
                                }`}
                            onClick={toggleWishlist}
                        >
                            <Heart className={`w-4 h-4 ${isInWishlistState ? 'fill-current' : ''}`} />
                        </Button>
                    </div>
                )}
            </div>

            {/* Content */}
            <CardContent className={`p-4 flex flex-col justify-between ${viewMode === 'list' ? 'flex-1 py-4' : ''}`}>
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{product.category}</p>
                            <h3 className="font-orbitron font-bold text-white group-hover:text-primary transition-colors line-clamp-2">
                                {product.name}
                            </h3>
                        </div>
                        {viewMode === 'list' && (
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-bold text-primary">{product.price}</span>
                                    {product.originalPrice && (
                                        <span className="text-sm text-muted-foreground line-through decoration-red-500/50">
                                            {product.originalPrice}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`w-3 h-3 ${i < Math.floor(product.rating)
                                    ? 'text-primary fill-primary'
                                    : 'text-mtrix-gray fill-mtrix-gray'
                                    }`}
                            />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">({product.rating})</span>
                    </div>
                </div>

                {viewMode === 'grid' && (
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-lg font-bold text-primary">{product.price}</span>
                        {product.originalPrice && (
                            <span className="text-sm text-muted-foreground line-through decoration-red-500/50">
                                {product.originalPrice}
                            </span>
                        )}
                    </div>
                )}

                {/* List Mode Actions */}
                {viewMode === 'list' && (
                    <div className="flex gap-3 mt-auto">
                        <Button
                            className="bg-white text-black hover:bg-primary hover:text-black font-bold px-8"
                            disabled={isOutOfStock}
                            onClick={handleAddToCart}
                        >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                        </Button>
                        <Button
                            variant="outline"
                            className={`border-mtrix-gray hover:border-primary hover:text-primary ${isInWishlistState ? 'text-primary border-primary' : ''
                                }`}
                            onClick={toggleWishlist}
                        >
                            <Heart className={`w-4 h-4 mr-2 ${isInWishlistState ? 'fill-current' : ''}`} />
                            {isInWishlistState ? 'In Wishlist' : 'Wishlist'}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ProductCard;
