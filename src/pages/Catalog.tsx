import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, X, SlidersHorizontal, LayoutGrid, Rows3, ArrowUpDown, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/catalog/ProductCard';
import CatalogFilters from '@/components/catalog/CatalogFilters';
import { cn } from '@/lib/utils';
import SEO from '@/components/SEO';
import { OptimizedImage } from '@/components/OptimizedImage';

interface Category {
  id: string;
  name: string;
  count: number;
  image_url?: string;
  description?: string;
}

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating';

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [displayCount, setDisplayCount] = useState(12);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { products, loading } = useProducts();

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [minRating, setMinRating] = useState(0);
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Sync URL with category
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && cat !== selectedCategory) {
      setSelectedCategory(cat);
    } else if (!cat && selectedCategory !== 'all') {
      // If no param but state has category, update URL
      setSearchParams({ category: selectedCategory });
    }
  }, [searchParams]);

  // Update URL when category changes
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    if (catId === 'all') {
      searchParams.delete('category');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: catId });
    }
    setDisplayCount(12);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch Categories & Metadata
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data: categoriesData, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true);

        if (error) throw error;

        // Get product counts
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

        const formattedCategories: Category[] = [
          { id: 'all', name: 'All Categories', count: productsData?.length || 0 },
          ...(categoriesData?.map(cat => ({
            id: cat.id,
            name: cat.name,
            count: productCounts[cat.id] || 0,
            image_url: cat.image_url,
            description: cat.description
          })) || [])
        ];

        setCategories(formattedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Update Current Category Info
  useEffect(() => {
    if (selectedCategory === 'all') {
      setCurrentCategory(null);
    } else {
      const cat = categories.find(c => c.id === selectedCategory);
      setCurrentCategory(cat || null);
    }
  }, [selectedCategory, categories]);

  // Filter & Sort Logic
  const filteredProducts = products
    .filter(product => {
      // Category Filter
      if (selectedCategory !== 'all') {
        // Match by ID if possible, fallback to name match from hook
        const category = categories.find(cat => cat.id === selectedCategory);
        if (category && product.category !== category.name) return false;
      }

      // Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesCategory = product.category?.toLowerCase().includes(query);
        if (!matchesName && !matchesCategory) return false;
      }

      // Price Filter
      const price = parseFloat(product.price.replace(/[^0-9.]/g, ''));
      if (price < priceRange[0] || price > priceRange[1]) return false;

      // Rating Filter
      if (product.rating < minRating) return false;

      // Stock Filter
      if (stockFilter === 'in_stock' && product.stockStatus === 'out_of_stock') return false;
      if (stockFilter === 'out_of_stock' && product.stockStatus !== 'out_of_stock') return false;

      return true;
    })
    .sort((a, b) => {
      const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ''));
      const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ''));

      switch (sortBy) {
        case 'price_asc': return priceA - priceB;
        case 'price_desc': return priceB - priceA;
        case 'rating': return b.rating - a.rating;
        case 'newest': default: return 0; // Assuming default order is newest from hook/DB
      }
    });

  const displayedProducts = filteredProducts.slice(0, displayCount);
  const hasMore = displayCount < filteredProducts.length;

  const clearFilters = () => {
    setSearchQuery('');
    setPriceRange([0, 10000]);
    setMinRating(0);
    setStockFilter('all');
    handleCategoryChange('all');
  };

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (stockFilter !== 'all' ? 1 : 0) +
    (selectedCategory !== 'all' ? 1 : 0);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-primary">
      <SEO
        title={currentCategory ? `${currentCategory.name} Products` : "Catalog"}
        description={currentCategory?.description || "Browse our premium collection of tech accessories."}
      />
      <Navbar />

      <main className="pt-24 pb-20">
        {/* Dynamic Hero Section */}
        <section className="relative py-20 px-6 overflow-hidden mb-12">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            {currentCategory?.image_url ? (
              <OptimizedImage
                src={currentCategory.image_url}
                alt={currentCategory.name}
                className="w-full h-full object-cover opacity-40 blur-sm scale-105"
              />
            ) : (
              <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-black to-black" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
          </div>

          <div className="container mx-auto text-center relative z-10">
            <h1 className="text-5xl md:text-7xl font-orbitron font-bold mb-6 animate-fade-up">
              {currentCategory ? (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-white uppercase">
                  {currentCategory.name}
                </span>
              ) : (
                <>
                  THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">CATALOGUE</span>
                </>
              )}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-up delay-100">
              {currentCategory?.description || "Curated gear for the digital generation."}
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Sidebar Filters (Desktop) */}
            <aside className="hidden lg:block w-72 shrink-0 space-y-8 sticky top-28 h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide pr-4">
              <CatalogFilters
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={handleCategoryChange}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                minRating={minRating}
                setMinRating={setMinRating}
                stockFilter={stockFilter}
                setStockFilter={setStockFilter}
                clearFilters={clearFilters}
              />
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="sticky top-20 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10 py-4 mb-8 -mx-4 px-4 lg:mx-0 lg:px-0 lg:bg-transparent lg:border-none lg:static lg:backdrop-blur-none">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">

                  {/* Search */}
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-white/5 border-white/10 focus:border-primary h-10 w-full"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Mobile Filter Trigger */}
                    <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" className="lg:hidden border-white/10 bg-white/5 flex-1 sm:flex-none">
                          <SlidersHorizontal className="w-4 h-4 mr-2" />
                          Filters
                          {activeFiltersCount > 0 && (
                            <Badge className="ml-2 bg-primary text-black h-5 px-1.5">{activeFiltersCount}</Badge>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="bg-black border-r border-white/10 w-full sm:max-w-md overflow-y-auto p-6">
                        <SheetHeader className="mb-8 text-left">
                          <SheetTitle className="text-2xl font-orbitron text-white">Filters</SheetTitle>
                        </SheetHeader>
                        <CatalogFilters
                          categories={categories}
                          selectedCategory={selectedCategory}
                          setSelectedCategory={(cat) => { handleCategoryChange(cat); setIsFilterOpen(false); }}
                          priceRange={priceRange}
                          setPriceRange={setPriceRange}
                          minRating={minRating}
                          setMinRating={setMinRating}
                          stockFilter={stockFilter}
                          setStockFilter={setStockFilter}
                          clearFilters={clearFilters}
                        />
                      </SheetContent>
                    </Sheet>

                    {/* Sort Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="border-white/10 bg-white/5 min-w-[140px] justify-between">
                          <span className="flex items-center">
                            <ArrowUpDown className="w-4 h-4 mr-2 text-muted-foreground" />
                            {sortBy === 'newest' && 'Newest'}
                            {sortBy === 'price_asc' && 'Price: Low to High'}
                            {sortBy === 'price_desc' && 'Price: High to Low'}
                            {sortBy === 'rating' && 'Best Rating'}
                          </span>
                          <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-black border-white/10">
                        <DropdownMenuItem onClick={() => setSortBy('newest')} className="text-white focus:bg-white/10 cursor-pointer">Newest</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy('price_asc')} className="text-white focus:bg-white/10 cursor-pointer">Price: Low to High</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy('price_desc')} className="text-white focus:bg-white/10 cursor-pointer">Price: High to Low</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy('rating')} className="text-white focus:bg-white/10 cursor-pointer">Best Rating</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* View Toggle */}
                    <div className="hidden sm:flex bg-white/5 border border-white/10 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={cn("p-2 rounded transition-all", viewMode === 'grid' ? 'bg-primary text-black shadow-sm' : 'text-muted-foreground hover:text-white')}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={cn("p-2 rounded transition-all", viewMode === 'list' ? 'bg-primary text-black shadow-sm' : 'text-muted-foreground hover:text-white')}
                      >
                        <Rows3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Active Filters Chips */}
                {activeFiltersCount > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 animate-fade-in">
                    {selectedCategory !== 'all' && (
                      <Badge variant="secondary" className="bg-white/10 text-white border border-white/10 hover:bg-white/20 transition-colors pl-3 pr-1 py-1">
                        {categories.find(c => c.id === selectedCategory)?.name}
                        <button onClick={() => handleCategoryChange('all')} className="ml-2 p-0.5 hover:bg-white/20 rounded-full">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                    {(priceRange[0] > 0 || priceRange[1] < 10000) && (
                      <Badge variant="secondary" className="bg-white/10 text-white border border-white/10 hover:bg-white/20 transition-colors pl-3 pr-1 py-1">
                        ₹{priceRange[0]} - ₹{priceRange[1]}
                        <button onClick={() => setPriceRange([0, 10000])} className="ml-2 p-0.5 hover:bg-white/20 rounded-full">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                    {stockFilter !== 'all' && (
                      <Badge variant="secondary" className="bg-white/10 text-white border border-white/10 hover:bg-white/20 transition-colors pl-3 pr-1 py-1">
                        {stockFilter === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                        <button onClick={() => setStockFilter('all')} className="ml-2 p-0.5 hover:bg-white/20 rounded-full">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                    <Button variant="link" size="sm" onClick={clearFilters} className="text-primary h-auto p-0 hover:no-underline hover:text-primary/80">
                      Clear All
                    </Button>
                  </div>
                )}
              </div>

              {/* Product Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-[4/5] bg-white/5 animate-pulse rounded-xl border border-white/5" />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-2xl font-orbitron font-bold mb-2 text-white">No products found</h3>
                  <p className="text-muted-foreground mb-6">Try adjusting your filters or search query.</p>
                  <Button onClick={clearFilters} className="bg-primary text-black hover:bg-primary/90">
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <>
                  <div className={cn(
                    "grid gap-6 transition-all duration-500",
                    viewMode === 'grid'
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                      : 'grid-cols-1'
                  )}>
                    {displayedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        viewMode={viewMode}
                        product={{
                          ...product,
                          stockStatus: product.stockStatus as "in_stock" | "out_of_stock" | "low_stock"
                        }}
                      />
                    ))}
                  </div>

                  {hasMore && (
                    <div className="text-center mt-16">
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-primary/50 text-primary hover:bg-primary hover:text-black min-w-[200px] h-12 text-lg"
                        onClick={() => setDisplayCount(prev => prev + 12)}
                      >
                        Load More Products
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Catalog;