import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface HeroImage {
  id: string;
  image_url: string;
  title?: string;
  subtitle?: string;
  cta_text?: string;
  cta_link?: string;
}

const HeroCarousel = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeroImages();
  }, []);

  const fetchHeroImages = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setHeroImages(data || []);
    } catch (error) {
      console.error('Error fetching hero images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (heroImages.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [heroImages.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  if (loading || heroImages.length === 0) {
    return (
      <div className="relative h-screen overflow-hidden bg-mtrix-dark flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-6xl md:text-8xl font-orbitron font-bold text-gradient-gold">
            MTRIX
          </h2>
          <p className="text-xl md:text-2xl text-foreground/80 mt-4">
            Style. Protection. Customization.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden shopping-cursor">
      {/* Hero Images */}
      <div className="relative w-full h-full">
        {heroImages.map((image, index) => (
          <div
            key={image.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div 
              className="w-full h-full bg-cover bg-center bg-mtrix-dark flex items-center justify-center"
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${image.image_url})`
              }}
            >
              <div className="text-center space-y-6 px-6">
                <h2 className="text-4xl sm:text-6xl md:text-8xl font-orbitron font-bold text-gradient-gold animate-fade-in">
                  {image.title || 'MTRIX'}
                </h2>
                <p className="text-lg sm:text-xl md:text-2xl text-foreground/80 animate-slide-up">
                  {image.subtitle || 'Style. Protection. Customization.'}
                </p>
                {image.cta_text && (
                  <Button 
                    size="lg" 
                    onClick={() => image.cta_link && navigate(image.cta_link)}
                    className="bg-gradient-gold text-mtrix-black font-semibold hover:shadow-gold-intense transition-all duration-300 transform hover:scale-105"
                  >
                    {image.cta_text}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-mtrix-black/50 hover:bg-mtrix-black/70 mtrix-glow"
        onClick={prevSlide}
      >
        <ChevronLeft className="w-8 h-8 text-primary" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-mtrix-black/50 hover:bg-mtrix-black/70 mtrix-glow"
        onClick={nextSlide}
      >
        <ChevronRight className="w-8 h-8 text-primary" />
      </Button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {heroImages.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-primary shadow-gold' 
                : 'bg-foreground/30 hover:bg-foreground/50'
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;