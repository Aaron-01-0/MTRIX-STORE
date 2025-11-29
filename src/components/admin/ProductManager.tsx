import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Search, Filter, ArrowRight, ArrowLeft, Save, Loader2, Wand2, CheckCircle2, Archive, FileText, Globe, Trash2, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProductImageManager from './ProductImageManager';
import VariantManager from './VariantManager';
import ProductList from './ProductList';
import { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type Product = Tables<'products'>;
type Category = Tables<'categories'>;
type Brand = Tables<'brands'>;
type ProductStatus = 'draft' | 'published' | 'archived';

const STEPS = [
  { id: 'essentials', label: 'Essentials', description: 'Basic info & pricing' },
  { id: 'variants', label: 'Variants', description: 'Colors & Sizes' },
  { id: 'details', label: 'Details', description: 'Description & attributes' },
  { id: 'inventory', label: 'Inventory', description: 'Stock & shipping' },
  { id: 'media', label: 'Media', description: 'Images & video' },
];

const ProductManager = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    name: '',
    short_description: '',
    detailed_description: '',
    category_id: '',
    subcategory_id: '', // New field for UI logic
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
    status: 'draft' as ProductStatus,
    is_new: false,
    is_trending: false,
    is_featured: false,
    meta_title: '',
    meta_description: '',
    tags: '',
    has_variants: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        supabase.from('products').select(`*, categories(name), brands(name)`).order('created_at', { ascending: false }),
        supabase.from('categories').select('*').eq('is_active', true).order('name'),
        supabase.from('brands').select('*').eq('is_active', true)
      ]);

      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (brandsRes.error) throw brandsRes.error;

      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
      setBrands(brandsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: "Error", description: "Failed to load data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProductIds);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProductIds(newSelected);
  };

  const handleSelectAll = (filteredIds: string[]) => {
    if (selectedProductIds.size === filteredIds.length && filteredIds.length > 0) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredIds));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedProductIds.size} products? This action cannot be undone.`)) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', Array.from(selectedProductIds));

      if (error) throw error;

      toast({ title: "Success", description: `${selectedProductIds.size} products deleted.` });
      setSelectedProductIds(new Set());
      loadData();
    } catch (error: any) {
      console.error('Error deleting products:', error);
      if (error.code === '23503') {
        const areArchived = Array.from(selectedProductIds).every(id =>
          products.find(p => p.id === id)?.status === 'archived'
        );

        toast({
          title: "Cannot Delete Products",
          description: areArchived
            ? "Some selected products are part of existing orders and cannot be deleted. They are safely archived."
            : "Some selected products are part of existing orders and cannot be deleted. Please archive them instead to preserve order history.",
          variant: "destructive"
        });
      } else {
        toast({ title: "Error", description: "Failed to delete products.", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: ProductStatus) => {
    if (selectedProductIds.size === 0) return;
    if (!confirm(`Update status of ${selectedProductIds.size} products to ${newStatus}?`)) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus, is_active: newStatus === 'published' })
        .in('id', Array.from(selectedProductIds));

      if (error) throw error;

      toast({ title: "Success", description: `${selectedProductIds.size} products updated to ${newStatus}.` });
      setSelectedProductIds(new Set());
      loadData();
    } catch (error: any) {
      console.error('Error updating products:', error);
      toast({ title: "Error", description: "Failed to update products.", variant: "destructive" });
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
      subcategory_id: '',
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
      status: 'draft',
      is_new: false,
      is_trending: false,
      is_featured: false,
      meta_title: '',
      meta_description: '',
      tags: '',
      has_variants: false
    });
    setEditingProduct(null);
    setCurrentStep(0);
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

  const generateSku = () => {
    if (!formData.name) {
      toast({ title: "Info", description: "Enter a product name first." });
      return;
    }
    const base = formData.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    handleInputChange('sku', `${base}-${random}`);
  };

  const saveProduct = async (silent = false, specificStatus?: ProductStatus) => {
    if (!formData.name || !formData.sku || !formData.base_price) {
      if (!silent) toast({ title: "Error", description: "Please fill in Name, SKU, and Base Price.", variant: "destructive" });
      return false;
    }

    setSaving(true);
    try {
      const statusToSave = specificStatus || formData.status;

      // Determine final category ID (Subcategory takes precedence if selected, otherwise Main)
      const finalCategoryId = formData.subcategory_id || formData.category_id || null;

      const productData = {
        name: formData.name,
        short_description: formData.short_description || null,
        detailed_description: formData.detailed_description || null,
        category_id: finalCategoryId,
        brand_id: formData.brand_id || null,
        sku: formData.sku,
        base_price: parseFloat(formData.base_price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        stock_status: formData.stock_status,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: formData.dimensions.width || formData.dimensions.height || formData.dimensions.depth ? formData.dimensions : null,
        return_policy: formData.return_policy || null,
        warranty_info: formData.warranty_info || null,
        internal_notes: formData.internal_notes || null,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
        reorder_point: parseInt(formData.reorder_point) || 10,
        reorder_quantity: formData.reorder_quantity ? parseInt(formData.reorder_quantity) : null,
        vendor_info: formData.vendor_info ? JSON.parse(formData.vendor_info) : null,
        status: statusToSave,
        is_active: statusToSave === 'published',
        is_new: formData.is_new,
        is_trending: formData.is_trending,
        is_featured: formData.is_featured,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };

      let result;
      if (editingProduct) {
        result = await supabase.from('products').update(productData).eq('id', editingProduct.id).select().single();
      } else {
        result = await supabase.from('products').insert([productData]).select().single();
      }

      if (result.error) throw result.error;

      if (!editingProduct && result.data) {
        setEditingProduct(result.data);
      }

      if (specificStatus) {
        setFormData(prev => ({ ...prev, status: specificStatus }));
      }

      if (!silent) toast({ title: "Success", description: `Product saved as ${statusToSave}.` });
      loadData();
      return true;
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({ title: "Error", description: error.message || "Failed to save.", variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      const success = await saveProduct(true);
      if (!success) return;
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const dims = product.dimensions as any || { width: '', height: '', depth: '' };

    // Logic to reverse-engineer Main/Sub category from the stored category_id
    const assignedCategory = categories.find(c => c.id === product.category_id);
    let mainCatId = '';
    let subCatId = '';

    if (assignedCategory) {
      if (assignedCategory.parent_id) {
        // It's a subcategory
        subCatId = assignedCategory.id;
        mainCatId = assignedCategory.parent_id;
      } else {
        // It's a main category
        mainCatId = assignedCategory.id;
      }
    }

    setFormData({
      name: product.name,
      short_description: product.short_description || '',
      detailed_description: product.detailed_description || '',
      category_id: mainCatId,
      subcategory_id: subCatId,
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
      status: (product.status as ProductStatus) || 'draft',
      is_new: product.is_new || false,
      is_trending: product.is_trending || false,
      is_featured: product.is_featured || false,
      meta_title: product.meta_title || '',
      meta_description: product.meta_description || '',
      tags: product.tags ? product.tags.join(', ') : '',
      has_variants: false
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      toast({ title: "Success", description: "Product deleted." });
      loadData();
    } catch (error: any) {
      if (error.code === '23503') {
        const product = products.find(p => p.id === productId);
        toast({
          title: "Cannot Delete Product",
          description: product?.status === 'archived'
            ? "This product is part of existing orders and cannot be deleted. It is safely archived."
            : "This product is part of existing orders and cannot be deleted. Please archive it instead.",
          variant: "destructive"
        });
      } else {
        toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
      }
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleStatusToggle = async (productId: string, newStatus: ProductStatus) => {
    try {
      const { error } = await supabase.from('products').update({ status: newStatus, is_active: newStatus === 'published' }).eq('id', productId);
      if (error) throw error;
      toast({ title: "Success", description: `Product ${newStatus === 'published' ? 'published' : 'hidden'}.` });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  };

  // Helper to get subcategories for selected main category
  const mainCategories = categories.filter(c => !c.parent_id);
  const subCategories = formData.category_id ? categories.filter(c => c.parent_id === formData.category_id) : [];

  // Derived state for bulk actions
  const selectedProductsList = products.filter(p => selectedProductIds.has(p.id));
  const allSelectedArchived = selectedProductsList.length > 0 && selectedProductsList.every(p => p.status === 'archived');
  const allSelectedPublished = selectedProductsList.length > 0 && selectedProductsList.every(p => p.status === 'published');

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-orbitron font-bold text-gradient-gold">Product Management</h2>
        <p className="text-muted-foreground">Manage your product catalog, inventory, and pricing.</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-mtrix-dark border-mtrix-gray pl-10" />
          </div>

          {/* Bulk Actions */}
          {selectedProductIds.size > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
              <Button variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete ({selectedProductIds.size})
              </Button>

              {!allSelectedPublished && (
                <Button
                  onClick={() => handleBulkStatusChange('published')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Globe className="w-4 h-4 mr-2" /> Publish ({selectedProductIds.size})
                </Button>
              )}

              {!allSelectedArchived && (
                <Button
                  variant="secondary"
                  onClick={() => handleBulkStatusChange('archived')}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  <Archive className="w-4 h-4 mr-2" /> Archive ({selectedProductIds.size})
                </Button>
              )}

              {allSelectedArchived && (
                <Button
                  variant="secondary"
                  onClick={() => handleBulkStatusChange('draft')}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <EyeOff className="w-4 h-4 mr-2" /> Restore ({selectedProductIds.size})
                </Button>
              )}
            </div>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("flex-shrink-0 gap-2", (statusFilter !== 'all' || categoryFilter !== 'all') && "border-primary text-primary")}>
                <Filter className="w-4 h-4" /> <span className="hidden sm:inline">Filter</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 bg-mtrix-dark border-mtrix-gray" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none text-gradient-gold">Filter Products</h4>
                  <p className="text-sm text-muted-foreground">Refine your product list.</p>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                    <SelectTrigger className="bg-black/20 border-white/10"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="bg-black/20 border-white/10"><SelectValue placeholder="All Categories" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {(statusFilter !== 'all' || categoryFilter !== 'all') && (
                  <Button variant="ghost" className="w-full text-muted-foreground hover:text-white" onClick={() => { setStatusFilter('all'); setCategoryFilter('all'); }}>Clear Filters</Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true); }} className="bg-gradient-gold text-mtrix-black hover:shadow-gold">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-mtrix-dark border-mtrix-gray p-0 gap-0">
            <div className="p-6 border-b border-white/10">
              <div className="flex justify-between items-center mb-6">
                <DialogTitle className="text-gradient-gold text-xl">{editingProduct ? 'Edit Product' : 'Create New Product'}</DialogTitle>
                <Badge variant="outline" className={cn("uppercase", formData.status === 'published' ? "bg-green-500/10 text-green-500 border-green-500/20" : formData.status === 'archived' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20")}>{formData.status}</Badge>
              </div>
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 h-0.5 w-full bg-white/10 -z-10" />
                {STEPS.map((step, idx) => (
                  <div key={step.id} className="flex flex-col items-center gap-2 bg-mtrix-dark px-2">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2", currentStep > idx ? "bg-primary border-primary text-black" : currentStep === idx ? "bg-black border-primary text-primary" : "bg-black border-white/20 text-muted-foreground")}>
                      {currentStep > idx ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </div>
                    <span className={cn("text-xs font-medium", currentStep === idx ? "text-primary" : "text-muted-foreground")}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 min-h-[400px]">
              {currentStep === 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Product Name *</Label>
                      <Input value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="bg-black/20 border-white/10" placeholder="e.g. Cyberpunk Hoodie" />
                    </div>
                    <div className="space-y-2">
                      <Label>SKU *</Label>
                      <div className="flex gap-2">
                        <Input value={formData.sku} onChange={(e) => handleInputChange('sku', e.target.value)} className="bg-black/20 border-white/10" placeholder="e.g. CYBER-HOOD-001" />
                        <Button variant="outline" size="icon" onClick={generateSku} title="Auto-generate SKU" className="border-white/10 hover:bg-white/5"><Wand2 className="w-4 h-4 text-primary" /></Button>
                      </div>
                    </div>

                    {/* Category Selection Split */}
                    <div className="space-y-2">
                      <Label>Main Category</Label>
                      <Select value={formData.category_id || undefined} onValueChange={(v) => handleInputChange('category_id', v)}>
                        <SelectTrigger className="bg-black/20 border-white/10"><SelectValue placeholder="Select Main Category" /></SelectTrigger>
                        <SelectContent>
                          {mainCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Subcategory (Optional)</Label>
                      <Select value={formData.subcategory_id || undefined} onValueChange={(v) => handleInputChange('subcategory_id', v)} disabled={!formData.category_id || subCategories.length === 0}>
                        <SelectTrigger className="bg-black/20 border-white/10"><SelectValue placeholder={subCategories.length === 0 ? "No subcategories" : "Select Subcategory"} /></SelectTrigger>
                        <SelectContent>
                          {subCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Select value={formData.brand_id || undefined} onValueChange={(v) => handleInputChange('brand_id', v)}>
                        <SelectTrigger className="bg-black/20 border-white/10"><SelectValue placeholder="Select brand" /></SelectTrigger>
                        <SelectContent>
                          {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Base Price (₹) *</Label>
                      <Input type="number" value={formData.base_price} onChange={(e) => handleInputChange('base_price', e.target.value)} className="bg-black/20 border-white/10" />
                    </div>
                    <div className="space-y-2">
                      <Label>Stock Quantity</Label>
                      <Input type="number" value={formData.stock_quantity} onChange={(e) => handleInputChange('stock_quantity', e.target.value)} className="bg-black/20 border-white/10" />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between p-4 bg-black/20 border border-white/10 rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-lg font-semibold">Enable Variants</Label>
                      <p className="text-sm text-muted-foreground">Does this product have different options like Color or Size?</p>
                    </div>
                    <Switch
                      checked={formData.has_variants}
                      onCheckedChange={(c) => handleInputChange('has_variants', c)}
                    />
                  </div>

                  {formData.has_variants ? (
                    editingProduct ? (
                      <VariantManager
                        productId={editingProduct.id}
                        productName={formData.name}
                        basePrice={parseFloat(formData.base_price) || 0}
                      />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Please save the product first to manage variants.
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-lg">
                      <p className="text-muted-foreground">Variants are disabled. This product will be treated as a single item.</p>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <Label>Short Description</Label>
                    <Textarea value={formData.short_description} onChange={(e) => handleInputChange('short_description', e.target.value)} className="bg-black/20 border-white/10" rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Detailed Description</Label>
                    <Textarea value={formData.detailed_description} onChange={(e) => handleInputChange('detailed_description', e.target.value)} className="bg-black/20 border-white/10" rows={5} />
                  </div>

                  {/* Tags Input */}
                  <div className="space-y-2">
                    <Label>Tags (comma separated)</Label>
                    <Input
                      value={formData.tags}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      className="bg-black/20 border-white/10"
                      placeholder="e.g. oversized, summer-vibes, new-drop"
                    />
                    <p className="text-xs text-muted-foreground">Used for "New Drop" and other auto-collections.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Meta Title (SEO)</Label>
                      <Input value={formData.meta_title} onChange={(e) => handleInputChange('meta_title', e.target.value)} className="bg-black/20 border-white/10" />
                    </div>
                    <div className="space-y-2">
                      <Label>Meta Description (SEO)</Label>
                      <Input value={formData.meta_description} onChange={(e) => handleInputChange('meta_description', e.target.value)} className="bg-black/20 border-white/10" />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Discount Price (₹)</Label>
                      <Input type="number" value={formData.discount_price} onChange={(e) => handleInputChange('discount_price', e.target.value)} className="bg-black/20 border-white/10" />
                    </div>
                    <div className="space-y-2">
                      <Label>Stock Status</Label>
                      <Select value={formData.stock_status} onValueChange={(v) => handleInputChange('stock_status', v)}>
                        <SelectTrigger className="bg-black/20 border-white/10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_stock">In Stock</SelectItem>
                          <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                          <SelectItem value="pre_order">Pre-order</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Low Stock Threshold</Label>
                      <Input type="number" value={formData.low_stock_threshold} onChange={(e) => handleInputChange('low_stock_threshold', e.target.value)} className="bg-black/20 border-white/10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Dimensions (cm)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input placeholder="W" type="number" value={formData.dimensions.width} onChange={(e) => handleInputChange('dimensions.width', e.target.value)} className="bg-black/20 border-white/10" />
                      <Input placeholder="H" type="number" value={formData.dimensions.height} onChange={(e) => handleInputChange('dimensions.height', e.target.value)} className="bg-black/20 border-white/10" />
                      <Input placeholder="D" type="number" value={formData.dimensions.depth} onChange={(e) => handleInputChange('dimensions.depth', e.target.value)} className="bg-black/20 border-white/10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                    <div className="flex items-center space-x-2">
                      <Label>Status:</Label>
                      <Select value={formData.status} onValueChange={(v) => handleInputChange('status', v)}>
                        <SelectTrigger className="bg-black/20 border-white/10 w-[140px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={formData.is_new} onCheckedChange={(c) => handleInputChange('is_new', c)} />
                      <Label>New</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={formData.is_trending} onCheckedChange={(c) => handleInputChange('is_trending', c)} />
                      <Label>Trending</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={formData.is_featured} onCheckedChange={(c) => handleInputChange('is_featured', c)} />
                      <Label>Featured</Label>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  {editingProduct ? (
                    <ProductImageManager productId={editingProduct.id} />
                  ) : (
                    <div className="text-center text-muted-foreground">Saving product to enable uploads...</div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 flex justify-between bg-black/20">
              <Button variant="outline" onClick={currentStep === 0 ? () => setShowCreateDialog(false) : handleBack} disabled={saving}>
                {currentStep === 0 ? 'Cancel' : <><ArrowLeft className="w-4 h-4 mr-2" /> Back</>}
              </Button>
              <div className="flex gap-2">
                {currentStep < STEPS.length - 1 ? (
                  <Button onClick={handleNext} disabled={saving} className="bg-primary text-black hover:bg-white">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{currentStep === 0 ? 'Save Draft & Continue' : 'Next'} <ArrowRight className="w-4 h-4 ml-2" /></>}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={() => saveProduct(false, 'draft')} variant="outline" disabled={saving} className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10">
                      <FileText className="w-4 h-4 mr-2" /> Save as Draft
                    </Button>
                    <Button onClick={() => saveProduct(false, 'published')} className="bg-green-500 text-black hover:bg-green-400">
                      <Globe className="w-4 h-4 mr-2" /> Publish Live
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ProductList
        products={filteredProducts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={loadData}
        onStatusChange={handleStatusToggle}
        selectedIds={selectedProductIds}
        onSelect={handleSelectProduct}
        onSelectAll={() => handleSelectAll(filteredProducts.map(p => p.id))}
      />
    </div>
  );
};

export default ProductManager;