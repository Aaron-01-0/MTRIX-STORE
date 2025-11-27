import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OptimizedImage } from "@/components/OptimizedImage";

interface Collection {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
}

const TrendingCollections = () => {
    const [collections, setCollections] = useState<Collection[]>([]);

    useEffect(() => {
        fetchCollections();
    }, []);

    const fetchCollections = async () => {
        try {
            // Fetch active categories to serve as collections
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .limit(3); // Get top 3 categories

            if (error) throw error;
            setCollections(data || []);
        } catch (error) {
            console.error('Error fetching collections:', error);
        }
    };

    if (collections.length === 0) return null;

    return (
        <section className="py-24 bg-black relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div className="max-w-2xl">
                        <span className="text-primary font-mono text-sm tracking-wider uppercase mb-2 block">Curated Selections</span>
                        <h2 className="text-4xl md:text-6xl font-orbitron font-bold text-white leading-tight">
                            TRENDING <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">COLLECTIONS</span>
                        </h2>
                    </div>
                    <Link to="/categories">
                        <Button variant="outline" className="border-white/20 text-white hover:bg-white hover:text-black rounded-full px-8 py-6 text-lg transition-all duration-300 group">
                            View All Collections <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px] lg:h-[500px]">
                    {/* Main Feature - Takes up half space */}
                    {collections[0] && (
                        <Link
                            to={`/catalog?category=${collections[0].id}`}
                            className="lg:col-span-6 relative group rounded-3xl overflow-hidden border border-white/10"
                        >
                            <div className="absolute inset-0">
                                <OptimizedImage
                                    src={collections[0].image_url || '/placeholder.svg'}
                                    alt={collections[0].name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                            </div>
                            <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
                                <h3 className="text-4xl font-orbitron font-bold text-white mb-4 group-hover:text-primary transition-colors">
                                    {collections[0].name}
                                </h3>
                                <p className="text-gray-300 text-lg mb-6 line-clamp-2 max-w-md transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                    {collections[0].description || "Explore our premium selection."}
                                </p>
                                <span className="inline-flex items-center text-white font-bold border-b border-primary pb-1 group-hover:text-primary transition-colors">
                                    Shop Collection <ArrowRight className="w-4 h-4 ml-2" />
                                </span>
                            </div>
                        </Link>
                    )}

                    {/* Secondary Features - Stacked */}
                    <div className="lg:col-span-6 flex flex-col gap-6">
                        {collections.slice(1, 3).map((collection) => (
                            <Link
                                key={collection.id}
                                to={`/catalog?category=${collection.id}`}
                                className="flex-1 relative group rounded-3xl overflow-hidden border border-white/10"
                            >
                                <div className="absolute inset-0">
                                    <OptimizedImage
                                        src={collection.image_url || '/placeholder.svg'}
                                        alt={collection.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                                </div>
                                <div className="absolute inset-0 p-8 flex flex-col justify-center items-start">
                                    <h3 className="text-3xl font-orbitron font-bold text-white mb-2 group-hover:text-primary transition-colors">
                                        {collection.name}
                                    </h3>
                                    <p className="text-gray-300 mb-4 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        {collection.description}
                                    </p>
                                    <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all duration-300">
                                        <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TrendingCollections;
