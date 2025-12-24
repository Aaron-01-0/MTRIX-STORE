import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/catalog/ProductCard';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import SEO from '@/components/SEO';
import { OptimizedImage } from '@/components/OptimizedImage';
import { useCategoryDetail } from '@/hooks/useCategoryDetail';



const CategoryPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();

    const { category, products, parentCategory, loading } = useCategoryDetail(slug);

    const isLoading = loading || !category;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Navbar />
                <main className="pb-20">
                    <section className="relative pt-32 pb-20 px-6 overflow-hidden mb-12">
                        <div className="container mx-auto text-center relative z-10">
                            <div className="h-12 w-3/4 mx-auto bg-white/10 animate-pulse rounded-lg mb-6"></div>
                            <div className="h-6 w-1/2 mx-auto bg-white/10 animate-pulse rounded-lg"></div>
                        </div>
                    </section>
                    <div className="container mx-auto px-4 lg:px-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="aspect-[4/5] bg-white/5 animate-pulse rounded-xl border border-white/5" />
                            ))}
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!category) {
        // Optional: Redirect or show Not Found
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold mb-4">Category Not Found</h1>
                <Button onClick={() => navigate('/catalog')}>Return to Catalog</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-primary">
            <SEO
                title={category.meta_title || category.name}
                description={category.meta_description || category.description || `Shop ${category.name}`}
            />
            <Navbar />

            <main className="pb-20">
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 px-6 overflow-hidden mb-12">
                    <div className="absolute inset-0 z-0">
                        {category.image_url ? (
                            <OptimizedImage
                                src={category.image_url}
                                alt={category.name}
                                className="w-full h-full object-cover opacity-40 blur-sm scale-105"
                            />
                        ) : (
                            <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-black to-black" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
                    </div>

                    <div className="container mx-auto text-center relative z-10">
                        <div className="w-full flex justify-start items-center px-4 md:px-0 mb-8">
                            <Button
                                variant="ghost"
                                className="text-muted-foreground hover:text-white flex items-center gap-2 hover:bg-white/10 transition-colors"
                                onClick={() => {
                                    if (category.parent_id && parentCategory) {
                                        navigate(`/categories/${parentCategory.slug}`);
                                    } else {
                                        navigate('/categories');
                                    }
                                }}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">
                                    {category.parent_id && parentCategory ? `Back to ${parentCategory.name}` : 'Back to Categories'}
                                </span>
                                <span className="sm:hidden">Back</span>
                            </Button>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-orbitron font-bold mb-6 animate-fade-up uppercase mt-12 md:mt-0">
                            MTRIX <span className="text-primary">x</span> {category.name}
                        </h1>
                        {category.description && (
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-up delay-100">
                                {category.description}
                            </p>
                        )}
                    </div>
                </section>

                {/* Product Grid */}
                <div className="container mx-auto px-4 lg:px-8">
                    {products.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                            <h3 className="text-2xl font-orbitron font-bold mb-2 text-white">No products found</h3>
                            <p className="text-muted-foreground">Watch this space. New heat coming soon.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {products.map((product) => {
                                // Logic to get the best image
                                const images = product.product_images || [];
                                const mainImage = images.find(img => img.is_main) || images.sort((a, b) => a.display_order - b.display_order)[0];
                                const imageUrl = mainImage?.image_url || product.image_url || '/placeholder.png';

                                return (
                                    <ProductCard
                                        key={product.id}
                                        product={{
                                            id: product.id,
                                            name: product.name,
                                            price: `₹${product.base_price}`,
                                            originalPrice: product.discount_price ? `₹${product.discount_price}` : undefined,
                                            image: imageUrl,
                                            rating: product.ratings_avg || 0,
                                            stockStatus: (product.stock_quantity === 0 ? 'out_of_stock' : product.stock_status) as "in_stock" | "out_of_stock" | "low_stock" || "in_stock",
                                            isNew: product.is_new || false,
                                            isTrending: product.is_trending || false,
                                            category: category.name
                                        }}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default CategoryPage;
