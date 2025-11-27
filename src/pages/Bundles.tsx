import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Bundle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: 'fixed' | 'custom' | 'quantity';
  price_type: 'fixed' | 'percentage_discount' | 'fixed_discount';
  price_value: number;
  cover_image: string | null;
}

const Bundles = () => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    try {
      const { data, error } = await supabase
        .from('bundles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBundles(data as any);
    } catch (error) {
      console.error('Error fetching bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriceDisplay = (bundle: Bundle) => {
    if (bundle.price_type === 'fixed') {
      return `₹${bundle.price_value}`;
    } else if (bundle.price_type === 'percentage_discount') {
      return `${bundle.price_value}% OFF`;
    } else {
      return `Save ₹${bundle.price_value}`;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-primary">
      <Navbar />

      <main className="pt-24 pb-20">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <h1 className="text-5xl md:text-7xl font-orbitron font-bold mb-6 tracking-wider">
              EXCLUSIVE <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">BUNDLES</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 font-light">
              Curated packs for the ultimate MTRIX experience. Save more when you buy together.
            </p>
          </div>
        </section>

        {/* Bundles Grid */}
        <section className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : bundles.length === 0 ? (
            <div className="text-center py-20 border border-white/10 rounded-2xl bg-white/5">
              <p className="text-gray-400 mb-4">No active bundles right now. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {bundles.map((bundle) => (
                <Card
                  key={bundle.id}
                  className="group bg-zinc-900/50 border-white/10 overflow-hidden hover:border-primary/50 transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/bundle/${bundle.id}`)}
                >
                  <div className="aspect-video relative overflow-hidden">
                    {bundle.cover_image ? (
                      <img
                        src={bundle.cover_image}
                        alt={bundle.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <Package className="w-16 h-16 text-white/10" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-primary text-black font-bold hover:bg-primary">
                        {getPriceDisplay(bundle)}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold font-orbitron mb-2 group-hover:text-primary transition-colors">
                        {bundle.name}
                      </h3>
                      <p className="text-muted-foreground line-clamp-2">
                        {bundle.description}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                      <Badge variant="outline" className="capitalize border-white/20">
                        {bundle.type} Bundle
                      </Badge>
                      <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10 p-0">
                        View Details <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Bundles;
