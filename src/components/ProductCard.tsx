import { Star, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils';
import { ImageWithFallback } from '@/components/ImageWithFallback';

interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  rating: number;
  isNew?: boolean;
  isTrending?: boolean;
  stockStatus?: string;
}

const ProductCard = ({ 
  id, 
  name, 
  price, 
  originalPrice, 
  image, 
  rating, 
  isNew, 
  isTrending, 
  stockStatus 
}: ProductCardProps) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const isOutOfStock = stockStatus === 'out_of_stock';
  
  return (
    <Card
      className={cn(
        "flex-shrink-0 w-72 snap-start bg-mtrix-dark border-mtrix-gray hover:border-primary transition-all duration-300 group overflow-hidden cursor-pointer",
        isOutOfStock && "opacity-60 grayscale"
      )}
      onClick={() => navigate(`/product/${id}`)}
    >
      <CardContent className="p-0">
        <div className="relative overflow-hidden bg-muted/20">
          <ImageWithFallback
            src={image}
            alt={name}
            className="w-full h-64 object-contain group-hover:scale-110 transition-transform duration-500"
            fallbackClassName="w-full h-64"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col space-y-2">
            {isOutOfStock && (
              <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                OUT OF STOCK
              </span>
            )}
            {!isOutOfStock && isNew && (
              <span className="bg-primary text-mtrix-black px-2 py-1 rounded-full text-xs font-semibold">
                NEW
              </span>
            )}
            {!isOutOfStock && isTrending && (
              <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                TRENDING
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-mtrix-black/50 hover:bg-mtrix-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Heart className="w-4 h-4 text-foreground hover:text-red-500" />
          </Button>

          {/* Overlay */}
          <div className="absolute inset-0 bg-mtrix-black/0 group-hover:bg-mtrix-black/20 transition-colors duration-300" />
        </div>

        <div className="p-6">
          <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
            {name}
          </h3>
          
          <div className="flex items-center space-x-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < rating 
                    ? 'text-primary fill-current' 
                    : 'text-muted-foreground'
                }`}
              />
            ))}
            <span className="text-sm text-muted-foreground ml-2">
              ({rating})
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-primary">
                {price}
              </span>
              {originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {originalPrice}
                </span>
              )}
            </div>
            <Button 
              size="sm" 
              className="bg-gradient-gold text-mtrix-black hover:shadow-gold transition-all duration-300"
              onClick={(e) => { 
                e.stopPropagation(); 
                if (!isOutOfStock) {
                  addToCart(id, 1); 
                }
              }}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
