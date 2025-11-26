import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const MyCustomOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customProducts, setCustomProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchCustomProducts();
  }, [user]);

  const fetchCustomProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_products')
        .select(`
          *,
          products(name),
          design_submissions(title, design_url)
        `)
        .eq('user_id', user?.id)
        .eq('is_available', true);

      if (error) throw error;
      setCustomProducts(data || []);
    } catch (error) {
      console.error('Error fetching custom products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 px-6 pb-20">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/profile')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-orbitron font-bold text-gradient-gold">
                My Custom Designs
              </h1>
              <p className="text-muted-foreground mt-2">
                Your approved custom designs ready to order
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : customProducts.length === 0 ? (
            <Card className="bg-mtrix-dark border-mtrix-gray text-center py-12">
              <CardContent>
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground mb-6">
                  You don't have any custom products yet
                </p>
                <Button
                  onClick={() => navigate('/flex-design')}
                  className="bg-gradient-gold text-mtrix-black hover:shadow-gold"
                >
                  Upload Your Design
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customProducts.map((product) => (
                <Card key={product.id} className="bg-mtrix-dark border-mtrix-gray overflow-hidden">
                  <div className="relative aspect-square">
                    <img
                      src={product.final_design_url}
                      alt={product.design_submissions?.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-3 right-3 bg-primary text-mtrix-black">
                      Custom Design
                    </Badge>
                  </div>

                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {product.design_submissions?.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {product.products?.name}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-mtrix-gray">
                      <span className="text-2xl font-bold text-primary">
                        ₹{product.price}
                      </span>
                      <Button
                        size="sm"
                        className="bg-gradient-gold text-mtrix-black hover:shadow-gold"
                        onClick={() => {
                          // Add to cart functionality can be added here
                          navigate('/cart');
                        }}
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Order Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyCustomOrders;
