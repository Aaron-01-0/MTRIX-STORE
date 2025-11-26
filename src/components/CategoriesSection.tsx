import { useState, useEffect } from 'react';
import { ArrowRight, Smartphone, Shirt, Coffee, MousePointer, ShoppingBag, Headphones, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Category = Tables<'categories'>;

const CategoriesSection = () => {
  const navigate = useNavigate();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const iconMap: Record<string, any> = {
    smartphone: Smartphone,
    shirt: Shirt,
    coffee: Coffee,
    mouse: MousePointer,
    bag: ShoppingBag,
    headphones: Headphones,
    package: Package
  };

  useEffect(() => {
      const loadCategories = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .not('parent_id', 'is', null)
          .limit(12);

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();

    // Set up real-time subscription
    const channel = supabase
      .channel('categories-section')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories'
        },
        () => {
          loadCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="container mx-auto relative">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-5xl font-orbitron font-bold text-gradient-gold mb-2">
              Shop by Category
            </h2>
            <p className="text-muted-foreground">Discover our curated collections</p>
          </div>
          <Button variant="ghost" className="mtrix-glow text-primary hover:text-primary-foreground group">
            View All
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <div className="flex overflow-x-auto pb-8 space-x-6 scrollbar-hide snap-x snap-mandatory"
             style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {categories.map((category) => {
            const Icon = iconMap[category.name.toLowerCase()] || Package;
            return (
              <Card
                key={category.id}
                className="flex-shrink-0 w-80 snap-start bg-gradient-to-br from-card via-card to-card/80 border-2 border-border/50 hover:border-primary/50 transition-all duration-500 group cursor-pointer hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2"
                onMouseEnter={() => setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => navigate(`/catalog?category=${category.id}`)}
              >
                <CardContent className="p-0 relative overflow-hidden h-full">
                  {/* Category image background */}
                  {category.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <div 
                        className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                        style={{ backgroundImage: `url(${category.image_url})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                    </div>
                  )}

                  {/* Content overlay */}
                  <div className="p-6 relative">
                    <div className="flex items-center space-x-4">
                      <div className="p-4 bg-gradient-gold rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-7 h-7 text-mtrix-black" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Explore button */}
                    <div className="mt-4 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span>Explore Collection</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;