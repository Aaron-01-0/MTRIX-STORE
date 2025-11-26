import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, ShoppingCart, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const Wishlist = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { wishlistItems, loading: wishlistLoading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleAddToCart = async (productId: string, wishlistItemId: string) => {
    await addToCart(productId, 1);
    await removeFromWishlist(wishlistItemId);
    toast({
      title: "Moved to Cart",
      description: "Item moved from wishlist to cart",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-gold/30">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-orbitron font-bold text-foreground">
                My Wishlist
              </h1>
              <p className="text-muted-foreground">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved for later
              </p>
            </div>
          </div>

          {wishlistItems.length > 0 && (
            <Link to="/catalog">
              <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-mtrix-black">
                Continue Shopping
              </Button>
            </Link>
          )}
        </div>

        {wishlistLoading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-mtrix-dark/50 rounded-full flex items-center justify-center mb-6 border border-mtrix-gray">
              <Heart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-orbitron font-bold text-foreground mb-3">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Save items you love here to buy them later. Start exploring our collection now!
            </p>
            <Button
              onClick={() => navigate('/catalog')}
              className="bg-gradient-gold text-mtrix-black hover:shadow-gold px-8 py-6 text-lg"
            >
              Browse Products <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <Card key={item.id} className="bg-mtrix-dark/50 border-mtrix-gray hover:border-gold/50 transition-all duration-300 group overflow-hidden backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={item.product.image_url || '/placeholder.svg'}
                      alt={item.product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <Button
                        onClick={() => handleAddToCart(item.product_id, item.id)}
                        className="w-full bg-gold text-mtrix-black hover:bg-white mb-2"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Move to Cart
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromWishlist(item.id)}
                      className="absolute top-2 right-2 bg-black/50 text-white hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-gold transition-colors">
                      {item.product.name}
                    </h3>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-white">
                          ₹{item.product.discount_price || item.product.base_price}
                        </span>
                        {item.product.discount_price && (
                          <span className="text-sm text-muted-foreground line-through">
                            ₹{item.product.base_price}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
