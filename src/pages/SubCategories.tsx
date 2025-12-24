import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useCategories } from '@/hooks/useCategories';

const SubCategories = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { categories, loading } = useCategories();

    // Derived state from cached categories
    const parentCategory = categories.find(c => c.slug === slug) || null;
    const subcategories = parentCategory
        ? categories.filter(c => c.parent_id === parentCategory.id).sort((a, b) => a.name.localeCompare(b.name))
        : [];

    useEffect(() => {
        if (!loading && !parentCategory && slug) {
            console.error('Parent category not found');
            navigate('/categories');
        }
    }, [loading, parentCategory, slug, navigate]);

    // Ensure we don't render "not found" redirect inside the render loop, handled by effect above
    // But we need to handle loading state


    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <main className="pb-20">
                {/* Hero */}
                <section className="relative pt-32 pb-20 px-6 overflow-hidden mb-12">
                    <div className="absolute inset-0 z-0">
                        {parentCategory?.image_url ? (
                            <div className="absolute inset-0">
                                <img
                                    src={parentCategory.image_url}
                                    alt={parentCategory.name}
                                    className="w-full h-full object-cover opacity-20 blur-sm scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
                            </div>
                        ) : (
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-black to-black" />
                        )}
                    </div>

                    <div className="container mx-auto text-center relative z-10">
                        <div className="w-full flex justify-start items-center px-4 md:px-0 mb-8">
                            <Button
                                variant="ghost"
                                className="text-muted-foreground hover:text-white flex items-center gap-2 hover:bg-white/10 transition-colors"
                                onClick={() => navigate('/categories')}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Back to Categories</span>
                                <span className="sm:hidden">Back</span>
                            </Button>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-orbitron font-bold mb-6 animate-fade-up uppercase mt-12 md:mt-0">
                            MTRIX <span className="text-primary">x</span> {parentCategory?.name}
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-up delay-100">
                            {parentCategory?.description || `Explore our exclusive ${parentCategory?.name} collection.`}
                        </p>
                    </div>
                </section>

                <div className="container mx-auto px-6">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-64 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {subcategories.map((category) => (
                                <Link
                                    key={category.id}
                                    to={`/category/${category.slug}`}
                                    className="group relative h-[300px] rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:border-primary/50 transition-all duration-500 block"
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
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-80 transition-opacity" />
                                    </div>

                                    {/* Content */}
                                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                        <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                            <h3 className="text-2xl font-orbitron font-bold text-white mb-2 group-hover:text-primary transition-colors">
                                                {category.name}
                                            </h3>
                                            <p className="text-muted-foreground line-clamp-2 text-sm mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                                {category.description || `View ${category.name}`}
                                            </p>

                                            <div className="flex items-center text-primary font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                                                Shop Now <ArrowRight className="w-4 h-4 ml-2" />
                                            </div>
                                        </div>

                                        {/* Count Badge */}
                                        <div className="absolute top-4 right-4">
                                            <span className="text-xs font-medium text-white/80 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                                {/* @ts-ignore */}
                                                {category.count} Items
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}

                            {subcategories.length === 0 && (
                                <div className="col-span-full text-center py-20">
                                    <p className="text-muted-foreground">No sub-categories found.</p>
                                    <Button variant="outline" className="mt-4" onClick={() => navigate(`/category/${slug}`)}>
                                        View All {parentCategory?.name} Products
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default SubCategories;
