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

type Category = Tables<'categories'>;
type Product = Tables<'products'>;

const CategoryPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [category, setCategory] = useState<Category | null>(null);
    const [parentCategory, setParentCategory] = useState<Category | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [collectionType, setCollectionType] = useState<'category' | 'new' | 'bestsellers' | 'restocked'>('category');

    useEffect(() => {
        if (slug) {
            loadContent();
        }
    }, [slug]);

    const loadContent = async () => {
        setLoading(true);
        try {
            // Check for Special Collections first
            if (['new-drop', 'bestsellers', 'back-in-stock'].includes(slug!)) {
                await loadCollection(slug!);
            } else {
                await loadCategory(slug!);
            }
        } catch (error) {
            console.error('Error loading content:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCollection = async (type: string) => {
        let query = supabase.from('products').select('*').eq('status', 'published').eq('is_active', true);
        let title = '';
        let description = '';

        if (type === 'new-drop') {
            setCollectionType('new');
            title = 'New Drops';
            description = 'The latest heat, just landed.';
            // Logic: Created in last 10 days OR tagged 'new-drop' OR is_new=true
            const tenDaysAgo = new Date();
            tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
            query = query.or(`created_at.gte.${tenDaysAgo.toISOString()},is_new.eq.true,tags.cs.{new-drop}`);
            query = query.order('created_at', { ascending: false });
        } else if (type === 'bestsellers') {
            setCollectionType('bestsellers');
            title = 'Bestsellers';
            description = 'Most wanted gear right now.';
            query = query.eq('is_trending', true); // Using trending flag as proxy for bestsellers for now
        } else if (type === 'back-in-stock') {
            setCollectionType('restocked');
            title = 'Back in Stock';
            description = 'Secured the bag. Re-up now.';
            // Logic: updated_at recently AND stock > 0 (simplified)
            query = query.gt('stock_quantity', 0).order('updated_at', { ascending: false });
        }

        const { data, error } = await query;
        if (error) throw error;

        setCategory({
            id: type,
            name: title,
            description: description,
            slug: type,
            image_url: null, // Could add static images for collections later
            parent_id: null,
            is_active: true,
            created_at: '',
            updated_at: '',
            meta_title: title,
            meta_description: description,
            display_order: 0
        });
        setParentCategory(null);
        setProducts(data || []);
    };

    const loadCategory = async (slug: string) => {
        setCollectionType('category');
        // 1. Get Category Details
        const { data: cat, error: catError } = await supabase
            .from('categories')
            .select('*')
            .eq('slug', slug)
            .single();

        if (catError || !cat) {
            console.error('Category not found');
            navigate('/catalog'); // Or handle gracefully
            return;
        }

        setCategory(cat);

        // 2. Get Parent Category if exists
        if (cat.parent_id) {
            const { data: parent } = await supabase
                .from('categories')
                .select('*')
                .eq('id', cat.parent_id)
                .single();
            setParentCategory(parent);
        } else {
            setParentCategory(null);
        }

        // 3. Get Products (Directly in this category OR in its subcategories)
        // First, find all subcategory IDs if this is a parent
        const { data: subcats } = await supabase
            .from('categories')
            .select('id')
            .eq('parent_id', cat.id);

        const subcatIds = subcats?.map(sc => sc.id) || [];
        const allCategoryIds = [cat.id, ...subcatIds];

        const { data: prods, error: prodError } = await supabase
            .from('products')
            .select('*')
            .in('category_id', allCategoryIds)
            .eq('status', 'published')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (prodError) throw prodError;
        setProducts(prods || []);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!category) return null;

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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={{
                                        id: product.id,
                                        name: product.name,
                                        price: `₹${product.base_price}`,
                                        originalPrice: product.discount_price ? `₹${product.discount_price}` : undefined,
                                        image: product.image_url || '/placeholder.png',
                                        rating: 5, // Default for now
                                        stockStatus: (product.stock_status as "in_stock" | "out_of_stock" | "low_stock") || "in_stock",
                                        isNew: product.is_new || false,
                                        isTrending: product.is_trending || false,
                                        category: category.name
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default CategoryPage;
