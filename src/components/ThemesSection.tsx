import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Theme = Tables<'themes'>;

const ThemesSection = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadThemes = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('themes')
          .select('*')
          .eq('is_active', true)
          .order('display_order')
          .limit(4);

        if (error) throw error;
        setThemes(data || []);
      } catch (error) {
        console.error('Error loading themes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadThemes();

    // Set up real-time subscription
    const channel = supabase
      .channel('themes-section')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'themes'
        },
        () => {
          loadThemes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading || themes.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-6 bg-mtrix-dark/30">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-4xl font-orbitron font-bold text-gradient-gold">
            Popular Themes
          </h2>
          <Button variant="ghost" className="mtrix-glow text-primary hover:text-primary-foreground">
            More Themes
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="space-y-6">
          {themes.slice(0, 2).map((theme, index) => (
            <div
              key={theme.id}
              className="group relative overflow-hidden rounded-xl bg-mtrix-dark border border-mtrix-gray hover:border-primary transition-all duration-500"
            >
              <div className="flex flex-col md:flex-row">
                <div 
                  className="w-full md:w-1/3 h-64 bg-cover bg-center"
                  style={{ 
                    backgroundImage: `url(${theme.image_url || '/api/placeholder/400/250'})` 
                  }}
                />
                <div className="flex-1 p-8 flex flex-col justify-center">
                  <h3 className="text-2xl font-semibold text-foreground group-hover:text-primary transition-colors mb-3">
                    {theme.name}
                  </h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {theme.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-semibold">
                      Theme {theme.display_order + 1}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-primary text-primary hover:bg-primary hover:text-mtrix-black"
                    >
                      Explore Theme
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
          
          {/* Faded themes with arrow */}
          <div className="relative">
            {themes.slice(2).map((theme, index) => (
              <div
                key={theme.id}
                className="group relative overflow-hidden rounded-xl bg-mtrix-dark border border-mtrix-gray hover:border-primary transition-all duration-500 opacity-30 blur-sm"
              >
                <div className="flex flex-col md:flex-row">
                  <div 
                    className="w-full md:w-1/3 h-64 bg-cover bg-center"
                    style={{ 
                      backgroundImage: `url(${theme.image_url || '/api/placeholder/400/250'})` 
                    }}
                  />
                  <div className="flex-1 p-8 flex flex-col justify-center">
                    <h3 className="text-2xl font-semibold text-foreground">
                      {theme.name}
                    </h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {theme.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-semibold">
                        Theme {theme.display_order + 1}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Show More Arrow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button 
                size="lg"
                className="bg-gradient-gold text-mtrix-black hover:shadow-gold transition-all duration-300"
              >
                View All Themes
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ThemesSection;