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
import InstallationInstructions from '@/components/product/InstallationInstructions';
import ToteBagDetails from '@/components/product/ToteBagDetails';
import { VariantSelector, ProductAttribute, ProductVariant } from '@/components/product/VariantSelector';
import ShippingReturns from '@/components/product/ShippingReturns';

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

  // --- State ---
  const [product, setProduct] = useState<DatabaseProduct | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]); // Use imported type
  const [productAttributes, setProductAttributes] = useState<ProductAttribute[]>([]); // Use imported type
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Dynamic Selections State
  const [selections, setSelections] = useState<Record<string, string>>({});

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

      // 1. Fetch Product, Attributes, and Variants in parallel for efficiency
      const [productRes, attributesRes, variantsRes] = await Promise.all([
        supabase
          .from('products')
          .select(`
            *,
            categories(id, name),
            brands(name),
            product_images(image_url, alt_text, is_main, display_order)
          `)
          .eq('id', id)
          .eq('is_active', true)
          .single(),

        supabase
          .from('product_attributes')
          .select('*, attribute_values(*)')
          .eq('product_id', id)
          .order('display_order'),

        supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', id)
          .eq('is_active', true)
      ]);

      if (productRes.error) throw productRes.error;

      // Handle Product
      const productData = productRes.data;
      setProduct(productData as unknown as DatabaseProduct);

      // Handle Attributes
      // @ts-ignore
      const attrs = (attributesRes.data || []) as ProductAttribute[];
      setProductAttributes(attrs);

      // Handle Variants
      // @ts-ignore
      const loadedVariants = (variantsRes.data || []) as ProductVariant[];
      setVariants(loadedVariants);

      // --- Initial Selection Logic ---
      if (loadedVariants.length > 0) {
        // Preference: Try to find an in-stock variant
        const inStockVariant = loadedVariants.find(v => v.stock_quantity > 0) || loadedVariants[0];

        const initialSelections: Record<string, string> = {};

        if (productData.has_variants) {
          if (productData.variant_type === 'multi' && inStockVariant.attribute_json) {
            // Load from JSON
            Object.entries(inStockVariant.attribute_json).forEach(([k, v]) => {
              // @ts-ignore
              initialSelections[k] = v;
            });
          } else {
            // Backward Compatibility / Simple Variants
            if (inStockVariant.color) initialSelections['Color'] = inStockVariant.color;
            if (inStockVariant.size) initialSelections['Size'] = inStockVariant.size;
          }
        }
        setSelections(initialSelections);
      }

    } catch (error) {
      console.error('Error loading product:', error);
      toast({
        title: "Error",
        description: "Failed to load product details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };





  // --- Derived State ---

  // Find matching variant based on selections
  useEffect(() => {
    if (!variants.length) {
      setSelectedVariantId(null);
      return;
    }

    const match = variants.find(v => {
      // 1. Check Multi-Attribute JSON
      if (v.attribute_json) {
        // Every key in attribute_json should match logical selections
        // Note: selections might contain 'Color' which maps to attribute_json['Color']
        return Object.entries(v.attribute_json).every(([key, val]) => selections[key] === val);
      }

      // 2. Fallback Legacy
      // If no attribute_json, we check v.color and v.size against selections['Color'] and selections['Size']
      const colorMatch = !v.color || v.color === selections['Color'];
      const sizeMatch = !v.size || v.size === selections['Size'];
      return colorMatch && sizeMatch;
    });

    setSelectedVariantId(match ? match.id : null);
  }, [selections, variants]);

  const selectedVariant = variants.find(v => v.id === selectedVariantId) || null;

  // Compute available colors and sizes for legacy support (or visualization fallback)
  // Ideally VariantSelector handles this, but we might need it for image filtering
  const selectedColor = selections['Color'] || null;

  // -------------------------------------------------------------
  // Construct "Virtual" Attributes if product_attributes is empty
  // but we have legacy variants (Color/Size columns populated).
  // This ensures VariantSelector works for old products too.
  // -------------------------------------------------------------
  const effectiveAttributes = [...productAttributes];
  if (effectiveAttributes.length === 0 && variants.length > 0) {
    const hasColor = variants.some(v => v.color);
    const hasSize = variants.some(v => v.size);

    if (hasColor) {
      const colors = Array.from(new Set(variants.map(v => v.color).filter(Boolean))) as string[];
      effectiveAttributes.push({
        id: 'legacy-color',
        name: 'Color',
        display_name: 'Color',
        display_order: 0,
        attribute_values: colors.map((c, i) => ({ id: `c-${i}`, value: c || '', display_order: i }))
      });
    }
    if (hasSize) {
      const sizes = Array.from(new Set(variants.map(v => v.size).filter(Boolean))) as string[];
      const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
      sizes.sort((a, b) => sizeOrder.indexOf(a || '') - sizeOrder.indexOf(b || ''));

      effectiveAttributes.push({
        id: 'legacy-size',
        name: 'Size',
        display_name: 'Size',
        display_order: 1,
        attribute_values: sizes.map((s, i) => ({ id: `s-${i}`, value: s || '', display_order: i }))
      });
    }
  }

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
                    <VariantSelector
                      attributes={effectiveAttributes}
                      variants={variants}
                      selections={selections}
                      onSelectionChange={(attr, val) => setSelections(prev => ({ ...prev, [attr]: val }))}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-black/40 rounded-lg border border-white/10 h-10">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-full flex items-center justify-center text-muted-foreground hover:text-white transition-colors hover:bg-white/5 rounded-l-lg"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-medium text-sm">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-full flex items-center justify-center text-muted-foreground hover:text-white transition-colors hover:bg-white/5 rounded-r-lg"
                      >
                        <Plus className="w-3 h-3" />
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
                      className={cn(
                        "flex-1 h-12 font-bold text-lg transition-all duration-300",
                        inStock
                          ? "bg-mtrix-dark border border-mtrix-gold text-mtrix-gold hover:bg-mtrix-gold hover:text-mtrix-black hover:shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                          : "bg-white/5 border border-white/10 text-muted-foreground cursor-not-allowed opacity-70"
                      )}
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
                        "h-12 w-12 border-mtrix-gold/30 bg-mtrix-dark hover:bg-mtrix-gold/10 hover:border-mtrix-gold text-mtrix-gold transition-all",
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
                  <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors flex flex-col justify-center">
                    <feature.icon className="w-5 h-5 text-primary mb-1.5" />
                    <h4 className="font-medium text-white text-sm leading-tight">{feature.title}</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{feature.desc}</p>
                  </div>
                ))}
              </div>

              {/* Accordions for Mobile/Clean Layout */}
              <Accordion type="single" collapsible className="w-full" defaultValue="description">
                <AccordionItem value="description" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-primary">Description</AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="relative pl-4 border-l-2 border-primary/30">
                      <p className="text-gray-300 leading-8 whitespace-pre-line font-light text-base tracking-wide">
                        {product.detailed_description || product.short_description || (
                          <span className="text-muted-foreground italic">
                            Detailed description coming soon. Stay tuned for updates on this product's features and specifications.
                          </span>
                        )}
                      </p>
                    </div>
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
                  <AccordionContent>
                    <ShippingReturns />
                  </AccordionContent>
                </AccordionItem>

                {/poster|frame|metal|acrylic|art/i.test(product.categories?.name || '') && (
                  <AccordionItem value="installation" className="border-white/10">
                    <AccordionTrigger className="text-white hover:text-primary">Installation Guide</AccordionTrigger>
                    <AccordionContent>
                      <InstallationInstructions
                        categoryName={product.categories?.name}
                        variantName={selectedVariant?.variant_name}
                      />
                    </AccordionContent>
                  </AccordionItem>
                )}

                {product.categories?.name?.toLowerCase().includes('tote') && (
                  <AccordionItem value="tote-details" className="border-white/10">
                    <AccordionTrigger className="text-white hover:text-primary">Product Details</AccordionTrigger>
                    <AccordionContent>
                      <ToteBagDetails />
                    </AccordionContent>
                  </AccordionItem>
                )}
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