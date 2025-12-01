import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Heart,
  ShoppingCart,
  Star,
  Plus,
  Minus,
  Truck,
  RefreshCw,
  Shield,
  Share2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils';
import SEO from '@/components/SEO';
import { OptimizedImage } from '@/components/OptimizedImage';
import RelatedProducts from '@/components/product/RelatedProducts';
import ReviewForm from '@/components/reviews/ReviewForm';
import ReviewList from '@/components/reviews/ReviewList';

interface DatabaseProduct {
  id: string;
  name: string;
  short_description: string | null;
  detailed_description: string | null;
  base_price: number;
  discount_price: number | null;
  sku: string;
  stock_quantity: number;
  stock_status: string;
  minimum_order_quantity: number;
  weight: number | null;
  dimensions: any;
  return_policy: string | null;
  warranty_info: string | null;
  ratings_avg: number;
  ratings_count: number;
  is_active: boolean;
  is_new: boolean;
  is_trending: boolean;
  is_featured: boolean;
  categories: { id: string; name: string } | null;
  brands: { name: string } | null;
  product_images: Array<{
    image_url: string;
    alt_text: string | null;
    is_main: boolean;
    display_order: number;
  }> | null;
  category_id: string | null;
}

interface Variant {
  id: string;
  variant_name: string;
  variant_type: string;
  color: string | null;
  size: string | null;
  absolute_price: number | null;
  stock_quantity: number | null;
  image_url: string | null;
  is_active: boolean | null;
}

const Product = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<DatabaseProduct | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [showStickyBar, setShowStickyBar] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshReviews, setRefreshReviews] = useState(0);

  const imageRef = useRef<HTMLDivElement>(null);
  const addToCartBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (id && id !== ':id') {
      loadProduct();
      window.scrollTo(0, 0);
    } else {
      setLoading(false);
    }

    // Check session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      if (addToCartBtnRef.current) {
        const rect = addToCartBtnRef.current.getBoundingClientRect();
        setShowStickyBar(rect.bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadProduct = async () => {
    try {
      setLoading(true);

      // Validate UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!id || !uuidRegex.test(id)) {
        console.error('Invalid Product ID:', id);
        setLoading(false);
        return;
      }

      // 1. Fetch Product
      let { data: productsData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          categories(id, name),
          brands(name),
          product_images(image_url, alt_text, is_main, display_order)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .limit(1);

      if (productError) throw productError;

      const productData = productsData?.[0] || null;

      // If not found, try fetching without is_active check to see if it exists but is inactive
      if (!productData) {
        const { data: inactiveProducts, error: inactiveError } = await supabase
          .from('products')
          .select('id, is_active, status')
          .eq('id', id)
          .limit(1);

        const inactiveProduct = inactiveProducts?.[0] || null;

        if (inactiveProduct) {
          console.warn('Product exists but is inactive:', inactiveProduct);
          toast({
            title: "Product Unavailable",
            description: "This product is currently inactive or archived.",
            variant: "destructive"
          });
          setProduct(null);
          return;
        } else if (inactiveError) {
          console.error('Error checking inactive product:', inactiveError);
        }

        console.warn('Product not found in DB with ID:', id);
        setProduct(null);
        return;
      }

      setProduct(productData as unknown as DatabaseProduct);

      // 2. Fetch Variants
      const { data: variantData } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', id)
        .eq('is_active', true);

      setVariants(variantData as unknown as Variant[] || []);

      if (variantData && variantData.length > 0) {
        // Auto-select first color and its available size
        const firstVariant = variantData[0];
        if (firstVariant.color) {
          setSelectedColor(firstVariant.color);
          // Find first available size for this color
          const sizeVariant = variantData.find((v: any) => v.color === firstVariant.color && v.stock_quantity > 0);
          if (sizeVariant) {
            setSelectedSize(sizeVariant.size);
            setSelectedVariantId(sizeVariant.id);
          } else {
            // Fallback if all out of stock
            const anySize = variantData.find((v: any) => v.color === firstVariant.color);
            if (anySize) {
              setSelectedSize(anySize.size);
              setSelectedVariantId(anySize.id);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error loading product:', error);
      toast({
        title: "Error",
        description: "Failed to load product details. See console for more info.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };





  // --- Derived State ---
  // Update selected variant ID when color/size changes
  useEffect(() => {
    if (selectedColor && selectedSize) {
      const variant = variants.find(v => v.color === selectedColor && v.size === selectedSize);
      setSelectedVariantId(variant ? variant.id : null);
    }
  }, [selectedColor, selectedSize, variants]);

  const selectedVariant = variants.find(v => v.id === selectedVariantId) || null;

  // Filter variants by selected color to get available sizes
  const availableSizes = variants
    .filter(v => v.color === selectedColor)
    .sort((a, b) => {
      const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      return sizes.indexOf(a.size || '') - sizes.indexOf(b.size || '');
    });

  // Get unique colors
  const availableColors = Array.from(new Set(variants.map(v => v.color))).filter(Boolean) as string[];

  // Images logic
  const baseImages = product?.product_images?.length
    ? product.product_images
      .sort((a, b) => a.display_order - b.display_order)
      .map(img => img.image_url)
    : ["/api/placeholder/500/500"];

  // If color is selected, show images for that color first
  // We need to match images that have variant_value === selectedColor
  // But currently product_images table stores this. 
  // The fetch above gets all images. We need to filter/sort them.
  // Assuming product_images has variant_value field (we need to update the fetch to include it)

  // Let's update the fetch first to include variant_value
  // ... (See next chunk for fetch update)

  // Filtered images based on color
  const filteredImages = product?.product_images || [];

  const displayImages = filteredImages.length > 0
    ? filteredImages.sort((a, b) => a.display_order - b.display_order).map(img => img.image_url)
    : ["/api/placeholder/500/500"];

  const productImages = displayImages;

  // Price logic
  const currentPrice = selectedVariant?.absolute_price != null
    ? Number(selectedVariant.absolute_price)
    : (product?.discount_price ?? product?.base_price ?? 0);

  const originalPrice = selectedVariant?.absolute_price != null
    ? null
    : (product?.discount_price ? product.base_price : null);

  const inStock = selectedVariant
    ? (Number(selectedVariant.stock_quantity || 0) > 0)
    : (product?.stock_status === 'in_stock' && (product?.stock_quantity || 0) > 0);

  // --- Handlers ---
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imageRef.current) return;
    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!inStock) {
      toast({ title: "Out of Stock", description: "This item is currently unavailable.", variant: "destructive" });
      return;
    }
    if (variants.length > 0 && !selectedVariantId) {
      toast({ title: "Select Option", description: "Please select a variant first." });
      return;
    }
    addToCart(product.id, quantity, selectedVariantId || undefined);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-primary animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <h1 className="text-4xl font-orbitron font-bold mb-4">Product Not Found</h1>
        <Button onClick={() => navigate('/catalog')} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-black">
          Return to Catalog
        </Button>
      </div>
    );
  }

  // --- Structured Data (JSON-LD) ---
  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": productImages,
    "description": product.short_description || product.detailed_description,
    "sku": product.sku,
    "brand": {
      "@type": "Brand",
      "name": product.brands?.name || "MTRIX"
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "INR",
      "price": currentPrice,
      "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition"
    },
    "aggregateRating": product.ratings_count > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": product.ratings_avg,
      "reviewCount": product.ratings_count
    } : undefined
  };

  return (
    <div className="min-h-screen bg-black text-white font-inter selection:bg-primary/30 selection:text-primary">
      <SEO
        title={product.name}
        description={product.short_description || product.detailed_description?.substring(0, 160) || `Buy ${product.name} at MTRIX.`}
        image={productImages[0]}
        structuredData={structuredData}
      />
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 lg:px-8">

          {/* Breadcrumbs */}
          <nav className="flex items-center text-sm text-muted-foreground mb-8 overflow-x-auto whitespace-nowrap">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link to="/catalog" className="hover:text-primary transition-colors">Catalog</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-white font-medium truncate">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* Left: Image Gallery (Sticky on Desktop) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="sticky top-24 space-y-4">
                {/* Main Image with Zoom */}
                <div
                  ref={imageRef}
                  className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 group cursor-crosshair"
                  onMouseEnter={() => setIsZoomed(true)}
                  onMouseLeave={() => setIsZoomed(false)}
                  onMouseMove={handleMouseMove}
                >
                  <OptimizedImage
                    src={productImages[selectedImageIndex]}
                    alt={product.name}
                    className={cn(
                      "w-full h-full object-contain transition-transform duration-200",
                      isZoomed ? "scale-150" : "scale-100"
                    )}
                    style={isZoomed ? { transformOrigin: `${mousePos.x}% ${mousePos.y}%` } : undefined}
                    loading="eager"
                    decoding="sync"
                  />
                  {!isZoomed && (
                    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 pointer-events-none">
                      <ZoomIn className="w-3 h-3" /> Hover to Zoom
                    </div>
                  )}

                  {/* Mobile Navigation Arrows */}
                  <div className="absolute inset-0 flex items-center justify-between p-4 lg:hidden pointer-events-none">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="pointer-events-auto bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
                      }}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="pointer-events-auto bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) => (prev + 1) % productImages.length);
                      }}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Thumbnails */}
                {productImages.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {productImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={cn(
                          "relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                          selectedImageIndex === idx ? "border-primary shadow-[0_0_10px_rgba(255,215,0,0.3)]" : "border-transparent opacity-60 hover:opacity-100"
                        )}
                      >
                        <OptimizedImage src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Product Details */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.is_new && <Badge className="bg-green-500/10 text-green-400 border-green-500/20">New Arrival</Badge>}
                  {product.is_trending && <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">Trending</Badge>}
                  {product.is_featured && <Badge className="bg-primary/10 text-primary border-primary/20">Featured</Badge>}
                  <Badge variant="outline" className="border-white/10 text-muted-foreground">{product.categories?.name}</Badge>
                </div>

                <h1 className="text-3xl md:text-4xl font-orbitron font-bold text-white mb-2 leading-tight">
                  {product.name}
                </h1>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    <span className="text-white font-medium">{product.ratings_avg ? Number(product.ratings_avg).toFixed(1) : '0.0'}</span>
                    <span>({product.ratings_count || 0} reviews)</span>
                  </div>
                  <span>•</span>
                  <span>SKU: {product.sku}</span>
                </div>
              </div>

              {/* Price */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-4xl font-bold text-gradient-gold">₹{currentPrice.toLocaleString()}</span>
                  {originalPrice && (
                    <>
                      <span className="text-lg text-muted-foreground line-through">₹{originalPrice.toLocaleString()}</span>
                      <Badge className="bg-red-500 text-white border-none">
                        {Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}% OFF
                      </Badge>
                    </>
                  )}
                </div>

                {/* Variants */}
                {variants.length > 0 && (
                  <div className="space-y-6 mb-6">
                    {/* Colors */}
                    {availableColors.length > 0 && (
                      <div className="space-y-3">
                        <span className="text-sm font-medium text-muted-foreground">Color: <span className="text-white ml-1">{selectedColor}</span></span>
                        <div className="flex flex-wrap gap-3">
                          {availableColors.map(color => {
                            const isSelected = selectedColor === color;
                            return (
                              <button
                                key={color}
                                onClick={() => {
                                  setSelectedColor(color);
                                  // Reset size if current size not available in new color?
                                  // Or try to keep same size?
                                  // Let's try to keep same size if possible
                                  const exists = variants.some(v => v.color === color && v.size === selectedSize);
                                  if (!exists) {
                                    // Select first available size
                                    const firstSize = variants.find(v => v.color === color)?.size;
                                    setSelectedSize(firstSize || null);
                                  }
                                  setSelectedImageIndex(0); // Reset image gallery
                                }}
                                className={cn(
                                  "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all",
                                  isSelected ? "border-primary scale-110" : "border-transparent hover:scale-105"
                                )}
                                style={{ backgroundColor: color.toLowerCase() }}
                                title={color}
                              >
                                {isSelected && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Sizes */}
                    {selectedColor && availableSizes.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-muted-foreground">Size: <span className="text-white ml-1">{selectedSize}</span></span>
                          <button className="text-xs text-primary hover:underline">Size Guide</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {availableSizes.map(variant => {
                            const isSelected = selectedSize === variant.size;
                            const isOutOfStock = (variant.stock_quantity || 0) <= 0;
                            return (
                              <button
                                key={variant.id}
                                onClick={() => !isOutOfStock && setSelectedSize(variant.size)}
                                disabled={isOutOfStock}
                                className={cn(
                                  "px-4 py-2 rounded-lg border text-sm font-medium transition-all min-w-[3rem]",
                                  isSelected
                                    ? "border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(255,215,0,0.1)]"
                                    : isOutOfStock
                                      ? "border-white/5 bg-white/5 text-muted-foreground/50 cursor-not-allowed decoration-slice line-through"
                                      : "border-white/10 bg-black/20 text-muted-foreground hover:border-white/30 hover:text-white"
                                )}
                              >
                                {variant.size}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-black/40 rounded-lg border border-white/10">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-medium">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {inStock ? (
                        <span className="text-green-400 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          In Stock
                        </span>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          Out of Stock
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      ref={addToCartBtnRef}
                      onClick={handleAddToCart}
                      disabled={!inStock}
                      className="flex-1 h-12 bg-gradient-gold text-mtrix-black font-bold text-lg hover:shadow-gold hover:scale-[1.02] transition-all duration-300"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      {inStock ? 'Add to Cart' : 'Out of Stock'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsWishlisted(!isWishlisted);
                        toast({ title: isWishlisted ? "Removed" : "Saved", description: isWishlisted ? "Removed from wishlist" : "Added to wishlist" });
                      }}
                      className={cn(
                        "h-12 w-12 border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all",
                        isWishlisted && "text-red-500 border-red-500/50 bg-red-500/10"
                      )}
                    >
                      <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Truck, title: "Free Shipping", desc: "On orders over ₹999" },
                  { icon: RefreshCw, title: "Easy Returns", desc: "30-day return policy" },
                  { icon: Shield, title: "Secure Payment", desc: "100% secure checkout" },
                  { icon: Share2, title: "Share Product", desc: "Share with friends" },
                ].map((feature, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary mb-2" />
                    <h4 className="font-medium text-white text-sm">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                ))}
              </div>

              {/* Accordions for Mobile/Clean Layout */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="description" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-primary">Description</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {product.detailed_description || product.short_description || "No description available."}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="specs" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-primary">Specifications</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className="text-muted-foreground">Brand</span>
                      <span className="text-white text-right">{product.brands?.name || 'MTRIX'}</span>
                      <span className="text-muted-foreground">Weight</span>
                      <span className="text-white text-right">{product.weight ? `${product.weight}g` : '-'}</span>
                      <span className="text-muted-foreground">Material</span>
                      <span className="text-white text-right">Premium</span>
                      {product.dimensions && (
                        <>
                          <span className="text-muted-foreground">Dimensions</span>
                          <span className="text-white text-right">
                            {typeof product.dimensions === 'string'
                              ? product.dimensions
                              : typeof product.dimensions === 'object'
                                ? `${product.dimensions.length || ''} x ${product.dimensions.width || ''} x ${product.dimensions.height || ''} ${product.dimensions.unit || 'cm'}`
                                : JSON.stringify(product.dimensions)
                            }
                          </span>
                        </>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="shipping" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-primary">Shipping & Returns</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm space-y-2">
                    <p>{product.return_policy || "30-day return policy. Items must be in original condition."}</p>
                    <p>{product.warranty_info || "1-year manufacturer warranty included."}</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Reviews Section (Desktop Tabs / Mobile Stack) */}
              <div className="pt-8 border-t border-white/10">
                <h3 className="text-2xl font-orbitron font-bold text-white mb-6">Customer Reviews</h3>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-4">
                    {userId ? (
                      <ReviewForm
                        productId={product.id}
                        userId={userId}
                        onSuccess={() => setRefreshReviews(prev => prev + 1)}
                      />
                    ) : (
                      <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-center">
                        <p className="text-muted-foreground mb-4">Please log in to write a review.</p>
                        <Button variant="outline" onClick={() => navigate('/login')}>Log In</Button>
                      </div>
                    )}
                  </div>
                  <div className="lg:col-span-8">
                    <ReviewList productId={product.id} refreshTrigger={refreshReviews} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {product.category_id && (
            <RelatedProducts
              categoryId={product.category_id}
              currentProductId={product.id}
            />
          )}
        </div>
      </main>

      {/* Sticky Bottom Bar (Mobile/Scroll) */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 p-4 transform transition-transform duration-300 z-50",
        showStickyBar ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="hidden md:flex items-center gap-4">
            <OptimizedImage src={productImages[0]} alt={product.name} className="w-12 h-12 rounded-md object-cover" />
            <div>
              <h4 className="font-medium text-white">{product.name}</h4>
              <span className="text-primary font-bold">₹{currentPrice.toLocaleString()}</span>
            </div>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={!inStock}
            className="w-full md:w-auto bg-gradient-gold text-mtrix-black font-bold hover:shadow-gold"
          >
            Add to Cart - ₹{currentPrice.toLocaleString()}
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Product;