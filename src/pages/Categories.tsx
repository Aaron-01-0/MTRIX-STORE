import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowRight } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    count?: number;
}

const Categories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data: categoriesData, error } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;

            // Get product counts for each category
            const { data: productsData } = await supabase
                .from('products')
                .select('category_id')
                .eq('is_active', true);

            const productCounts = productsData?.reduce((acc: Record<string, number>, product) => {
                if (product.category_id) {
                    acc[product.category_id] = (acc[product.category_id] || 0) + 1;
                }
                return acc;
            }, {}) || {};

            const formattedCategories = categoriesData?.map(cat => ({
                ...cat,
                count: productCounts[cat.id] || 0
            })) || [];

            setCategories(formattedCategories);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <main className="pt-24 pb-20">
                {/* Hero */}
                <section className="relative py-20 px-6 overflow-hidden mb-12">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-black to-black" />
                    <div className="container mx-auto text-center relative z-10">
                        <h1 className="text-5xl md:text-7xl font-orbitron font-bold mb-6 animate-fade-up">
                            EXPLORE <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">CATEGORIES</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-up delay-100">
                            Browse our curated collections and find exactly what you need.
                        </p>
                    </div>
                </section>

                <div className="container mx-auto px-6">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-64 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {categories.map((category) => (
                                <Link
                                    key={category.id}
                                    to={`/catalog?category=${category.id}`}
                                    className="group relative h-80 rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:border-primary/50 transition-all duration-500"
                                >
                                    {/* Background Image */}
                                    <div className="absolute inset-0">
                                        {category.image_url ? (
                                            <img
                                                src={category.image_url}
                                                alt={category.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-white/5 to-black" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                                    </div>

                                    {/* Content */}
                                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                            <h3 className="text-3xl font-orbitron font-bold text-white mb-2 group-hover:text-primary transition-colors">
                                                {category.name}
                                            </h3>
                                            <p className="text-muted-foreground mb-4 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                                {category.description || `Browse our collection of ${category.name}`}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-white/60 bg-white/10 px-3 py-1 rounded-full">
                                                    {category.count} Products
                                                </span>
                                                <span className="flex items-center text-primary font-bold opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500 delay-200">
                                                    Shop Now <ArrowRight className="w-5 h-5 ml-2" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Categories;
