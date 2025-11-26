import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Image, Video, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProductImageManager from './ProductImageManager';
import ProductList from './ProductList';
import { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;
type Category = Tables<'categories'>;
type Brand = Tables<'brands'>;

const ProductManager = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    short_description: '',
    detailed_description: '',
    category_id: '',
    brand_id: '',
    sku: '',
    base_price: '',
    discount_price: '',
    stock_quantity: '',
    stock_status: 'in_stock',
    weight: '',
    dimensions: { width: '', height: '', depth: '' },
    return_policy: '',
    warranty_info: '',
    internal_notes: '',
    low_stock_threshold: '5',
    reorder_point: '10',
    reorder_quantity: '',
    vendor_info: '',
    is_active: true,
    is_new: false,
    is_trending: false,
    is_featured: false,
    meta_title: '',
    meta_description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        supabase.from('products').select(`
          *,
          categories(name),
          brands(name)
        `).order('created_at', { ascending: false }),
        supabase.from('categories').select('*').eq('is_active', true),
        supabase.from('brands').select('*').eq('is_active', true)
      ]);

      // Debug logging
      console.log('Products fetch:', productsRes);
      console.log('Categories fetch:', categoriesRes);
      console.log('Brands fetch:', brandsRes);

      if (productsRes.error) {
        console.error('Products error:', productsRes.error);
        throw productsRes.error;
      }
      if (categoriesRes.error) {
        console.error('Categories error:', categoriesRes.error);
        throw categoriesRes.error;
      }
      if (brandsRes.error) {
        console.error('Brands error:', brandsRes.error);
        throw brandsRes.error;
      }

      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
      setBrands(brandsRes.data || []);

      console.log('Categories loaded:', categoriesRes.data?.length || 0);
      console.log('Brands loaded:', brandsRes.data?.length || 0);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      short_description: '',
      detailed_description: '',
      category_id: '',
      brand_id: '',
      sku: '',
      base_price: '',
      discount_price: '',
      stock_quantity: '',
      stock_status: 'in_stock',
      weight: '',
      dimensions: { width: '', height: '', depth: '' },
      return_policy: '',
      warranty_info: '',
      internal_notes: '',
      low_stock_threshold: '5',
      reorder_point: '10',
      reorder_quantity: '',
      vendor_info: '',
      is_active: true,
      is_new: false,
      is_trending: false,
      is_featured: false,
      meta_title: '',
      meta_description: ''
    });
    setEditingProduct(null);
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('dimensions.')) {
      const dimField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        dimensions: { ...prev.dimensions, [dimField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.sku || !formData.base_price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const productData = {
        name: formData.name,
        short_description: formData.short_description || null,
        detailed_description: formData.detailed_description || null,
        category_id: formData.category_id || null,
        brand_id: formData.brand_id || null,
        sku: formData.sku,
        base_price: parseFloat(formData.base_price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        stock_status: formData.stock_status,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: formData.dimensions.width || formData.dimensions.height || formData.dimensions.depth
          ? formData.dimensions
          : null,
        return_policy: formData.return_policy || null,
        warranty_info: formData.warranty_info || null,
        internal_notes: formData.internal_notes || null,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
        reorder_point: parseInt(formData.reorder_point) || 10,
        reorder_quantity: formData.reorder_quantity ? parseInt(formData.reorder_quantity) : null,
        vendor_info: formData.vendor_info ? JSON.parse(formData.vendor_info) : null,
        is_active: formData.is_active,
        is_new: formData.is_new,
        is_trending: formData.is_trending,
        is_featured: formData.is_featured,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null
      };

      let result;
      if (editingProduct) {
        result = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
      } else {
        result = await supabase
          .from('products')
          .insert([productData]);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: `Product ${editingProduct ? 'updated' : 'created'} successfully`
      });

      setShowCreateDialog(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const dims = product.dimensions as any || { width: '', height: '', depth: '' };
    setFormData({
      name: product.name,
      short_description: product.short_description || '',
      detailed_description: product.detailed_description || '',
      category_id: product.category_id || '',
      brand_id: product.brand_id || '',
      sku: product.sku,
      base_price: product.base_price.toString(),
      discount_price: product.discount_price?.toString() || '',
      stock_quantity: product.stock_quantity?.toString() || '0',
      stock_status: product.stock_status || 'in_stock',
      weight: product.weight?.toString() || '',
      dimensions: dims,
      return_policy: product.return_policy || '',
      warranty_info: product.warranty_info || '',
      internal_notes: product.internal_notes || '',
      low_stock_threshold: product.low_stock_threshold?.toString() || '5',
      reorder_point: product.reorder_point?.toString() || '10',
      reorder_quantity: product.reorder_quantity?.toString() || '',
      vendor_info: product.vendor_info ? JSON.stringify(product.vendor_info) : '',
      is_active: product.is_active || false,
      is_new: product.is_new || false,
      is_trending: product.is_trending || false,
      is_featured: product.is_featured || false,
      meta_title: product.meta_title || '',
      meta_description: product.meta_description || ''
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully"
      });

      loadData();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-orbitron font-bold text-gradient-gold">Product Management</h2>
        <p className="text-muted-foreground">Manage your product catalog, inventory, and pricing.</p>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-mtrix-dark border-mtrix-gray pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSearchTerm('')}
            className="flex-shrink-0"
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button
              onClick={() => { resetForm(); setShowCreateDialog(true); }}
              className="bg-gradient-gold text-mtrix-black hover:shadow-gold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-mtrix-dark border-mtrix-gray">
            <DialogHeader>
              <DialogTitle className="text-gradient-gold">
                {editingProduct ? 'Edit Product' : 'Create New Product'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-6 bg-mtrix-black">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                  <TabsTrigger value="images">Images</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                  <TabsTrigger value="extra">Extra</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="bg-mtrix-black border-mtrix-gray"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU *</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => handleInputChange('sku', e.target.value)}
                        className="bg-mtrix-black border-mtrix-gray"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category_id || undefined}
                        onValueChange={(value) => handleInputChange('category_id', value)}
                      >
                        <SelectTrigger className="bg-mtrix-black border-mtrix-gray">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brand">Brand</Label>
                      <Select
                        value={formData.brand_id || undefined}
                        onValueChange={(value) => handleInputChange('brand_id', value)}
                      >
                        <SelectTrigger className="bg-mtrix-black border-mtrix-gray">
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="short_description">Short Description</Label>
                    <Textarea
                      id="short_description"
                      value={formData.short_description}
                      onChange={(e) => handleInputChange('short_description', e.target.value)}
                      className="bg-mtrix-black border-mtrix-gray"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="detailed_description">Detailed Description</Label>
                    <Textarea
                      id="detailed_description"
                      value={formData.detailed_description}
                      onChange={(e) => handleInputChange('detailed_description', e.target.value)}
                      className="bg-mtrix-black border-mtrix-gray"
                      rows={5}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (grams)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                        className="bg-mtrix-black border-mtrix-gray"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Dimensions (cm)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="Width"
                          type="number"
                          value={formData.dimensions.width}
                          onChange={(e) => handleInputChange('dimensions.width', e.target.value)}
                          className="bg-mtrix-black border-mtrix-gray"
                        />
                        <Input
                          placeholder="Height"
                          type="number"
                          value={formData.dimensions.height}
                          onChange={(e) => handleInputChange('dimensions.height', e.target.value)}
                          className="bg-mtrix-black border-mtrix-gray"
                        />
                        <Input
                          placeholder="Depth"
                          type="number"
                          value={formData.dimensions.depth}
                          onChange={(e) => handleInputChange('dimensions.depth', e.target.value)}
                          className="bg-mtrix-black border-mtrix-gray"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="return_policy">Return Policy</Label>
                    <Textarea
                      id="return_policy"
                      value={formData.return_policy}
                      onChange={(e) => handleInputChange('return_policy', e.target.value)}
                      className="bg-mtrix-black border-mtrix-gray"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="warranty_info">Warranty Information</Label>
                    <Textarea
                      id="warranty_info"
                      value={formData.warranty_info}
                      onChange={(e) => handleInputChange('warranty_info', e.target.value)}
                      className="bg-mtrix-black border-mtrix-gray"
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="images" className="space-y-4">
                  {editingProduct ? (
                    <ProductImageManager productId={editingProduct.id} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-mtrix-gray rounded-lg">
                      <Image className="w-12 h-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-white">Save Product First</h3>
                      <p className="text-muted-foreground max-w-sm mt-2">
                        You need to save the basic product details before you can upload images.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="inventory" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="base_price">Base Price (₹) *</Label>
                      <Input
                        id="base_price"
                        type="number"
                        step="0.01"
                        value={formData.base_price}
                        onChange={(e) => handleInputChange('base_price', e.target.value)}
                        className="bg-mtrix-black border-mtrix-gray"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discount_price">Discount Price (₹)</Label>
                      <Input
                        id="discount_price"
                        type="number"
                        step="0.01"
                        value={formData.discount_price}
                        onChange={(e) => handleInputChange('discount_price', e.target.value)}
                        className="bg-mtrix-black border-mtrix-gray"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stock_quantity">Stock Quantity</Label>
                      <Input
                        id="stock_quantity"
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                        className="bg-mtrix-black border-mtrix-gray"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stock_status">Stock Status</Label>
                      <Select
                        value={formData.stock_status}
                        onValueChange={(value) => handleInputChange('stock_status', value)}
                      >
                        <SelectTrigger className="bg-mtrix-black border-mtrix-gray">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_stock">In Stock</SelectItem>
                          <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                          <SelectItem value="pre_order">Pre-order</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>



                    <div className="space-y-2">
                      <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                      <Input
                        id="low_stock_threshold"
                        type="number"
                        value={formData.low_stock_threshold}
                        onChange={(e) => handleInputChange('low_stock_threshold', e.target.value)}
                        className="bg-mtrix-black border-mtrix-gray"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reorder_point">Reorder Point</Label>
                      <Input
                        id="reorder_point"
                        type="number"
                        value={formData.reorder_point}
                        onChange={(e) => handleInputChange('reorder_point', e.target.value)}
                        className="bg-mtrix-black border-mtrix-gray"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reorder_quantity">Reorder Quantity</Label>
                      <Input
                        id="reorder_quantity"
                        type="number"
                        value={formData.reorder_quantity}
                        onChange={(e) => handleInputChange('reorder_quantity', e.target.value)}
                        className="bg-mtrix-black border-mtrix-gray"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_new"
                        checked={formData.is_new}
                        onCheckedChange={(checked) => handleInputChange('is_new', checked)}
                      />
                      <Label htmlFor="is_new">New</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_trending"
                        checked={formData.is_trending}
                        onCheckedChange={(checked) => handleInputChange('is_trending', checked)}
                      />
                      <Label htmlFor="is_trending">Trending</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_featured"
                        checked={formData.is_featured}
                        onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                      />
                      <Label htmlFor="is_featured">Featured</Label>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="seo" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta_title">Meta Title</Label>
                    <Input
                      id="meta_title"
                      value={formData.meta_title}
                      onChange={(e) => handleInputChange('meta_title', e.target.value)}
                      className="bg-mtrix-black border-mtrix-gray"
                      placeholder="SEO-friendly title for search engines"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_description">Meta Description</Label>
                    <Textarea
                      id="meta_description"
                      value={formData.meta_description}
                      onChange={(e) => handleInputChange('meta_description', e.target.value)}
                      className="bg-mtrix-black border-mtrix-gray"
                      rows={3}
                      placeholder="Brief description for search engine results (max 160 characters)"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="extra" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="internal_notes">Internal Notes</Label>
                    <Textarea
                      id="internal_notes"
                      value={formData.internal_notes}
                      onChange={(e) => handleInputChange('internal_notes', e.target.value)}
                      className="bg-mtrix-black border-mtrix-gray"
                      rows={3}
                      placeholder="Private notes for admin use only"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendor_info">Vendor Info (JSON)</Label>
                    <Textarea
                      id="vendor_info"
                      value={formData.vendor_info}
                      onChange={(e) => handleInputChange('vendor_info', e.target.value)}
                      className="bg-mtrix-black border-mtrix-gray"
                      rows={5}
                      placeholder='{"vendor_name": "Example", "contact": "..."}'
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-gold text-mtrix-black hover:shadow-gold"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products List */}
      <ProductList
        products={filteredProducts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={loadData}
      />
    </div>
  );
};

export default ProductManager;