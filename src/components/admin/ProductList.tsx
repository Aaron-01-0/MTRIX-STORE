import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Trash2, Image, Video, Eye, EyeOff, Globe } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import ProductImageManager from './ProductImageManager';
import ProductVideoManager from './ProductVideoManager';
import { ProductVariantManager } from './ProductVariantManager';
import { InlineStockEditor } from './InlineStockEditor';
import { cn } from '@/lib/utils';

type Product = Tables<'products'> & {
  categories?: { name: string } | null;
  brands?: { name: string } | null;
};

type ProductStatus = 'draft' | 'published' | 'archived';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onRefresh?: () => void;
  onStatusChange?: (productId: string, newStatus: ProductStatus) => void;
  selectedIds?: Set<string>;
  onSelect?: (productId: string) => void;
  onSelectAll?: () => void;
}

const ProductList = ({ products, onEdit, onDelete, onRefresh, onStatusChange, selectedIds, onSelect, onSelectAll }: ProductListProps) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [mediaType, setMediaType] = useState<'images' | 'videos'>('images');

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-500';
      case 'out_of_stock':
        return 'bg-red-500';
      case 'pre_order':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const openMediaManager = (product: Product, type: 'images' | 'videos') => {
    setSelectedProduct(product);
    setMediaType(type);
    setMediaDialogOpen(true);
  };

  if (products.length === 0) {
    return (
      <Card className="bg-mtrix-dark border-mtrix-gray">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-mtrix-gray rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Products Found</h3>
            <p className="text-muted-foreground">
              Create your first product to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {onSelectAll && (
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={onSelectAll} className="text-xs">
            {selectedIds?.size === products.length && products.length > 0 ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-6">
        {products.map((product) => (
          <Card
            key={product.id}
            className={cn(
              "bg-mtrix-dark border-mtrix-gray transition-colors",
              selectedIds?.has(product.id) && "border-primary/50 bg-primary/5"
            )}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                {/* Checkbox for selection */}
                {onSelect && (
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-white/20 bg-black/40 text-primary focus:ring-primary cursor-pointer"
                      checked={selectedIds?.has(product.id) || false}
                      onChange={() => onSelect(product.id)}
                    />
                  </div>
                )}

                <div className="flex-1">
                  <CardTitle className="text-foreground mb-2">{product.name}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      SKU: {product.sku}
                    </Badge>
                    {product.categories && (
                      <Badge variant="outline" className="text-xs">
                        {product.categories.name}
                      </Badge>
                    )}
                    {product.brands && (
                      <Badge variant="outline" className="text-xs">
                        {product.brands.name}
                      </Badge>
                    )}
                    <Badge className={`text-xs text-white ${getStockStatusColor(product.stock_status)}`}>
                      {product.stock_status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    {product.is_new && (
                      <Badge className="text-xs bg-green-500 text-white">NEW</Badge>
                    )}
                    {product.is_trending && (
                      <Badge className="text-xs bg-red-500 text-white">TRENDING</Badge>
                    )}
                    {product.is_featured && (
                      <Badge className="text-xs bg-purple-500 text-white">FEATURED</Badge>
                    )}
                    {!product.is_active && (
                      <Badge className="text-xs bg-gray-500 text-white">INACTIVE</Badge>
                    )}
                    {product.stock_quantity !== null && product.low_stock_threshold !== null && product.stock_quantity <= product.low_stock_threshold && (
                      <Badge className="text-xs bg-orange-500 text-white animate-pulse">LOW STOCK</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {product.short_description}
                  </p>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      ₹{product.base_price}
                    </div>
                    {product.discount_price && (
                      <div className="text-sm text-muted-foreground line-through">
                        ₹{product.discount_price}
                      </div>
                    )}
                  </div>
                  <InlineStockEditor
                    productId={product.id}
                    currentStock={product.stock_quantity}
                    onUpdate={() => onRefresh?.()}
                  />
                  {product.ratings_count > 0 && (
                    <div className="text-sm text-muted-foreground">
                      ⭐ {product.ratings_avg} ({product.ratings_count} reviews)
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(product)}
                  className="flex items-center space-x-1"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </Button>

                <Button
                  size="sm"
                  variant={product.status === 'published' ? 'default' : 'secondary'}
                  onClick={() => onStatusChange?.(product.id, product.status === 'published' ? 'draft' : 'published')}
                  className={cn("flex items-center space-x-1", product.status === 'published' ? "bg-green-600 hover:bg-green-700" : "bg-yellow-600 hover:bg-yellow-700")}
                >
                  {product.status === 'published' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span>{product.status === 'published' ? 'Live' : 'Hidden'}</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openMediaManager(product, 'images')}
                  className="flex items-center space-x-1"
                >
                  <Image className="w-4 h-4" />
                  <span>Manage</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/product/${product.id}`, '_blank')}
                  className="flex items-center space-x-1"
                >
                  <Globe className="w-4 h-4" />
                  <span>Preview</span>
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(product.id)}
                  className="flex items-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Media Manager Dialog */}
      <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Manage {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <Tabs defaultValue="images" className="mt-4">
              <TabsList className="grid w-full grid-cols-3 bg-muted">
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="videos">Videos</TabsTrigger>
                <TabsTrigger value="variants">Variants</TabsTrigger>
              </TabsList>

              <TabsContent value="images" className="mt-4">
                <ProductImageManager productId={selectedProduct.id} />
              </TabsContent>

              <TabsContent value="videos" className="mt-4">
                <ProductVideoManager productId={selectedProduct.id} />
              </TabsContent>

              <TabsContent value="variants" className="mt-4">
                <ProductVariantManager productId={selectedProduct.id} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductList;