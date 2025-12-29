import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/useCategories';
import { getOptimizedImageUrl, imagePresets } from '@/lib/cloudinary';

const CategoryGrid = () => {
    const { categories: allCategories, loading } = useCategories();

    // Filter to show only top 4 main categories (ignoring 'all' and subcategories if needed)
    // Assuming we want top-level categories.
    const categories = allCategories
        .filter(c => c.id !== 'all' && !c.parent_id)
        .slice(0, 4);

    return (
        <section className="py-20 bg-mtrix-black">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-2">
                            Shop By <span className="text-primary">Category</span>
                        </h2>
                        <p className="text-muted-foreground">Find the perfect gear for your setup.</p>
                    </div>
                    <Link to="/categories">
                        <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-black group">
                            View All Categories
                            <ArrowRight className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-[300px] rounded-xl bg-mtrix-dark" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {categories.map((category) => (
                            <Link key={category.id} to={`/category/${category.slug}`} className="group">
                                <Card className="bg-mtrix-dark border-mtrix-gray overflow-hidden h-[300px] relative transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:border-primary/50">
                                    <div className="absolute inset-0">
                                        <img
                                            src={getOptimizedImageUrl(category.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80', imagePresets.category)}
                                            alt={category.name}
                                            loading="lazy"
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-40"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                                    </div>

                                    <CardContent className="absolute inset-0 flex flex-col justify-end p-6">
                                        <h3 className="text-2xl font-orbitron font-bold text-white mb-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                            {category.name}
                                        </h3>
                                        <div className="w-12 h-1 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default CategoryGrid;
