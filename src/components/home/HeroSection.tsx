import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface HeroImageConfig {
    headline_size?: number;
    headline_weight?: string;
    headline_color?: string;
    subtitle_size?: number;
    subtitle_color?: string;
    button_style?: 'solid' | 'outline' | 'ghost';
    button_color?: string;
    button_text_color?: string;
    overlay_color?: string;
    overlay_opacity?: number;
    overlay_gradient_direction?: string;
    animation_style?: 'fade' | 'slide' | 'zoom' | 'ken-burns';
    animation_duration?: number;
    content_width?: number;
    vertical_alignment?: 'top' | 'center' | 'bottom';
    subtitle_alignment?: 'left' | 'center' | 'right';
    text_shadow?: 'none' | 'soft' | 'hard';
}

interface HeroImage {
    id: string;
    image_url: string;
    mobile_image_url?: string;
    title: string | null;
    subtitle: string | null;
    alt_text: string | null;
    button_text: string | null;
    button_link: string | null;
    text_alignment?: 'left' | 'center' | 'right';
    text_color?: string;
    overlay_gradient?: string;
    schedule_start?: string;
    schedule_end?: string;
    config: HeroImageConfig;
}

const HeroSection = () => {
    const [slides, setSlides] = useState<HeroImage[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHeroImages();
    }, []);

    useEffect(() => {
        if (slides.length > 1) {
            const slide = slides[currentSlide];
            const duration = (slide.config?.animation_duration || 5) * 1000;

            const interval = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % slides.length);
            }, duration);
            return () => clearInterval(interval);
        }
    }, [slides, currentSlide]);

    const fetchHeroImages = async () => {
        try {
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('hero_images')
                .select('*')
                .eq('is_active', true)
                .order('display_order');

            if (error) throw error;

            if (data && data.length > 0) {
                // Filter by schedule
                const activeSlides = data.filter(slide => {
                    if (slide.schedule_start && slide.schedule_start > now) return false;
                    if (slide.schedule_end && slide.schedule_end < now) return false;
                    return true;
                });

                if (activeSlides.length > 0) {
                    setSlides(activeSlides as HeroImage[]);
                } else {
                    setFallback();
                }
            } else {
                setFallback();
            }
        } catch (error) {
            console.error('Error fetching hero images:', error);
            setFallback();
        } finally {
            setLoading(false);
        }
    };

    const setFallback = () => {
        setSlides([{
            id: 'default',
            image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=2070',
            title: 'ELEVATE YOUR DIGITAL REALITY',
            subtitle: 'Premium gear for the creators, the gamers, and the visionaries.',
            alt_text: 'Hero Background',
            button_text: 'SHOP NOW',
            button_link: '/catalog',
            text_alignment: 'center',
            text_color: '#ffffff',
            overlay_gradient: 'bg-gradient-to-b from-black/70 via-black/50 to-mtrix-black',
            config: {
                headline_size: 5,
                headline_weight: '700',
                overlay_opacity: 50,
                animation_style: 'fade',
                content_width: 80,
                vertical_alignment: 'center',
                subtitle_alignment: 'center'
            }
        }]);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    if (loading) {
        return <div className="h-screen w-full bg-mtrix-black animate-pulse" />;
    }

    const slide = slides[currentSlide];
    const config = slide.config || {};

    // Helper to get alignment classes
    const getAlignmentClass = (align?: string) => {
        switch (align) {
            case 'left': return 'items-start text-left';
            case 'right': return 'items-end text-right';
            default: return 'items-center text-center';
        }
    };

    const getVerticalAlignment = (align?: string) => {
        switch (align) {
            case 'top': return 'justify-start pt-32';
            case 'bottom': return 'justify-end pb-32';
            default: return 'justify-center';
        }
    };

    const getAnimationClass = (style?: string, isActive?: boolean) => {
        if (!isActive) return 'opacity-0';
        switch (style) {
            case 'slide': return 'opacity-100 animate-in slide-in-from-right duration-1000';
            case 'zoom': return 'opacity-100 animate-in zoom-in-105 duration-[10s]';
            case 'ken-burns': return 'opacity-100 scale-110 transition-transform duration-[20s] ease-linear';
            default: return 'opacity-100 transition-opacity duration-1000';
        }
    };

    return (
        <section className="relative h-screen w-full overflow-hidden bg-mtrix-black group">
            {/* Background Image */}
            {slides.map((s, index) => (
                <div
                    key={s.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
                >
                    {/* Dynamic Gradient Overlay */}
                    <div
                        className={`absolute inset-0 z-10 ${s.overlay_gradient === 'none' ? '' : (s.overlay_gradient || 'bg-gradient-to-b from-black/50 to-black')}`}
                        style={{
                            opacity: (s.config?.overlay_opacity || 50) / 100
                        }}
                    />
                    {/* Directional Gradient Overlay (if specified) */}
                    {s.config?.overlay_gradient_direction && s.overlay_gradient !== 'none' && (
                        <div
                            className={`absolute inset-0 z-10 bg-gradient-${s.config.overlay_gradient_direction} from-black/80 via-transparent to-transparent`}
                            style={{ opacity: 0.5 }}
                        />
                    )}

                    {/* Image */}
                    <picture>
                        {s.mobile_image_url && <source media="(max-width: 768px)" srcSet={s.mobile_image_url} />}
                        <img
                            src={s.image_url}
                            alt={s.alt_text || "Hero Background"}
                            className={`w-full h-full object-cover ${index === currentSlide && s.config?.animation_style === 'ken-burns' ? 'scale-125' : 'scale-100'} transition-transform duration-[20s] ease-linear`}
                        />
                    </picture>
                </div>
            ))}

            {/* Navigation Arrows */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/20 text-white/50 hover:bg-black/50 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/20 text-white/50 hover:bg-black/50 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>
                </>
            )}

            {/* Content */}
            <div className={`relative z-20 h-full flex flex-col px-4 md:px-16 ${getVerticalAlignment(config.vertical_alignment)} ${getAlignmentClass(slide.text_alignment)}`}>
                <div
                    className="space-y-6 animate-fade-up"
                    style={{ width: `${config.content_width || 100}%` }}
                >
                    <h1
                        className="font-orbitron tracking-tight leading-tight animate-pulse-slow"
                        style={{
                            fontSize: `${config.headline_size || 5}rem`,
                            fontWeight: config.headline_weight || '700',
                            color: 'transparent',
                            backgroundImage: slide.text_color ? `linear-gradient(to bottom, ${slide.text_color}, ${slide.text_color}88)` : 'linear-gradient(to bottom, #ffffff, #aaaaaa)',
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.1))',
                            textShadow: config.text_shadow === 'soft' ? '0 0 20px rgba(255,255,255,0.3)' :
                                config.text_shadow === 'hard' ? '2px 2px 0px rgba(0,0,0,1)' : 'none'
                        }}
                    >
                        {slide.title || "ELEVATE YOUR DIGITAL REALITY"}
                    </h1>

                    <p
                        className={`text-xl md:text-2xl max-w-2xl font-light tracking-wide ${config.subtitle_alignment === 'left' ? 'text-left' :
                            config.subtitle_alignment === 'right' ? 'text-right' :
                                config.subtitle_alignment === 'center' ? 'text-center' :
                                    ''
                            }`}
                        style={{ color: slide.text_color ? `${slide.text_color}cc` : '#cccccc' }}
                    >
                        {slide.subtitle || "Premium gear for the creators, the gamers, and the visionaries."}
                    </p>

                    <div className={`flex flex-col sm:flex-row gap-6 pt-8 ${slide.text_alignment === 'left' ? 'justify-start' : slide.text_alignment === 'right' ? 'justify-end' : 'justify-center'}`}>
                        <Link to={slide.button_link || "/catalog"}>
                            <Button
                                className={`text-lg px-10 py-8 rounded-none skew-x-[-10deg] transition-all duration-300 hover:scale-105 ${config.button_style === 'outline' ? 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-black' :
                                    config.button_style === 'ghost' ? 'bg-transparent text-white hover:bg-white/10' :
                                        'bg-primary text-black hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]'
                                    }`}
                            >
                                <span className="skew-x-[10deg] font-bold tracking-wider flex items-center gap-2">
                                    {slide.button_text || "SHOP NOW"} <ArrowRight className="w-5 h-5" />
                                </span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Slide Indicators */}
            {slides.length > 1 && (
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-30 flex gap-3">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`h-1 rounded-full transition-all duration-300 ${index === currentSlide ? "w-8 bg-primary" : "w-2 bg-white/30 hover:bg-white/50"
                                }`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default HeroSection;
