import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Drop {
    id: string;
    name: string;
    description: string | null;
    cover_image: string | null;
    category: string | null;
}

const LimitedDrops = () => {
    const [drops, setDrops] = useState<Drop[]>([]);

    useEffect(() => {
        fetchDrops();
    }, []);

    const fetchDrops = async () => {
        try {
            const { data, error } = await supabase
                .from('drops')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true })
                .limit(4);

            if (error) throw error;
            setDrops(data || []);
        } catch (error) {
            console.error('Error fetching drops:', error);
        }
    };

    if (drops.length === 0) return null;

    return (
        <section className="py-20 bg-mtrix-black relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-4 flex items-center justify-center gap-4">
                        LIMITED DROPS <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                    </h2>
                    <p className="text-xl text-muted-foreground">
                        Fresh, exclusive drops for creators, gamers & collectors.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {drops.map((drop) => (
                        <div
                            key={drop.id}
                            className="group relative h-[400px] rounded-2xl overflow-hidden border border-mtrix-gray hover:border-primary/50 transition-all duration-500"
                        >
                            {/* Background Image */}
                            <div className="absolute inset-0">
                                <img
                                    src={drop.cover_image || '/placeholder.svg'}
                                    alt={drop.name}
                                    loading="lazy"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                            </div>

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-8">
                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full mb-3 backdrop-blur-sm border border-primary/20">
                                        {drop.category || 'EXCLUSIVE'}
                                    </span>
                                    <h3 className="text-3xl font-orbitron font-bold text-white mb-2">
                                        {drop.name}
                                    </h3>
                                    <p className="text-gray-300 mb-6 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                        {drop.description}
                                    </p>
                                    <Link to={`/drops/${drop.id}`}>
                                        <Button className="bg-white text-black hover:bg-primary hover:text-black transition-colors duration-300">
                                            Explore Drop <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LimitedDrops;
