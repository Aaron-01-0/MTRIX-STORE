import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Trash2, Package, Save, ArrowLeft, ArrowRight } from 'lucide-react';
import { useStorageUpload } from '@/hooks/useStorageUpload';

// Types
interface Bundle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: 'fixed' | 'custom' | 'quantity';
  price_type: 'fixed' | 'percentage_discount' | 'fixed_discount';
  price_value: number;
  cover_image: string | null;
  is_active: boolean;
}

interface BundleItem {
  id?: string;
  category_id?: string | null; // Added for UI filtering
  product_id: string | null;
  variant_id: string | null;
  quantity: number;
  slot_name?: string;
  allowed_categories?: string[];
}

interface Product {
  id: string;
  name: string;
  category_id: string; // Added to filter by category
  variants?: { id: string; color: string; size: string }[];
}

interface Category {
  id: string;
  name: string;
}

const BundleManager = () => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const { toast } = useToast();
  const { uploadFile, uploading } = useStorageUpload();

  // Form State
  const [formData, setFormData] = useState<Partial<Bundle>>({
    type: 'fixed',
    price_type: 'fixed',
    is_active: true
  });
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);
  const [step, setStep] = useState(1);

  useEffect(() => {
    fetchBundles();
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchBundles = async () => {
    try {
      const { data, error } = await supabase
        .from('bundles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBundles(data as any);
    } catch (error) {
      console.error('Error fetching bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, category_id, product_variants(id, color, size)');
    if (data) setProducts(data as any);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');
    if (data) setCategories(data as any);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = await uploadFile(e.target.files[0], { bucket: 'product-images' });
      if (url) setFormData({ ...formData, cover_image: url });
    }
  };

  const saveBundle = async () => {
    try {
      setLoading(true);

      // 1. Save Bundle
      const bundleData = {
        name: formData.name,
        slug: formData.slug || formData.name?.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        type: formData.type,
        price_type: formData.price_type,
        price_value: formData.price_value,
        cover_image: formData.cover_image,
        is_active: formData.is_active
      };

      let bundleId = formData.id;

      if (bundleId) {
        const { error } = await supabase.from('bundles').update(bundleData).eq('id', bundleId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('bundles').insert(bundleData).select().single();
        if (error) throw error;
        bundleId = data.id;
      }

      // 2. Save Items
      // First delete existing items if editing
      if (formData.id) {
        await supabase.from('bundle_items').delete().eq('bundle_id', bundleId);
      }

      const itemsToInsert = bundleItems.map(item => ({
        bundle_id: bundleId,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        slot_name: item.slot_name,
        allowed_category_id: item.category_id // Map UI category selection to DB column
      }));

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase.from('bundle_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      toast({ title: "Success", description: "Bundle saved successfully" });
      setView('list');
      fetchBundles();
      setStep(1);
      setFormData({ type: 'fixed', price_type: 'fixed', is_active: true });
      setBundleItems([]);

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setBundleItems([...bundleItems, { category_id: null, product_id: null, variant_id: null, quantity: 1 }]);
  };

  const updateItem = (index: number, field: keyof BundleItem, value: any) => {
    const newItems = [...bundleItems];

    // Reset downstream fields if upstream changes
    if (field === 'category_id') {
      newItems[index] = { ...newItems[index], category_id: value, product_id: null, variant_id: null };
    } else if (field === 'product_id') {
      newItems[index] = { ...newItems[index], product_id: value, variant_id: null };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }

    setBundleItems(newItems);
  };

  const removeItem = (index: number) => {
    setBundleItems(bundleItems.filter((_, i) => i !== index));
  };

  const deleteBundle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bundle?')) return;

    try {
      setLoading(true);
      // 1. Delete items first (cascade should handle this, but being safe)
      await supabase.from('bundle_items').delete().eq('bundle_id', id);

      // 2. Delete bundle
      const { error } = await supabase.from('bundles').delete().eq('id', id);
      if (error) throw error;

      toast({ title: "Success", description: "Bundle deleted successfully" });
      fetchBundles();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (view === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Bundle Manager</h2>
          <Button onClick={() => setView('create')} className="bg-primary text-black hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" /> Create Bundle
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {bundles.map(bundle => (
            <Card key={bundle.id} className="bg-black/40 border-white/10 overflow-hidden group">
              <div className="aspect-video relative">
                {bundle.cover_image ? (
                  <img src={bundle.cover_image} alt={bundle.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <Package className="w-12 h-12 text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button variant="secondary" onClick={() => {
                    setFormData(bundle);
                    // Fetch items for this bundle
                    supabase.from('bundle_items').select('*').eq('bundle_id', bundle.id)
                      .then(({ data }) => {
                        if (data) {
                          // We need to backfill category_id for existing items to make the UI work
                          const itemsWithCategory = data.map((item: any) => {
                            // If it has allowed_category_id (custom bundle), use that
                            if (item.allowed_category_id) {
                              return { ...item, category_id: item.allowed_category_id };
                            }
                            // Otherwise try to infer from product (fixed bundle)
                            const product = products.find(p => p.id === item.product_id);
                            return {
                              ...item,
                              category_id: product?.category_id || null
                            };
                          });
                          setBundleItems(itemsWithCategory);
                        }
                        setView('edit');
                      });
                  }}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => deleteBundle(bundle.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg">{bundle.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">{bundle.type} Bundle</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="font-mono text-primary">
                    {bundle.price_type === 'fixed' ? `₹${bundle.price_value}` : `${bundle.price_value}% OFF`}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${bundle.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {bundle.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setView('list')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-2xl font-bold">{view === 'create' ? 'Create New Bundle' : 'Edit Bundle'}</h2>
      </div>

      <div className="flex gap-4 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 h-2 rounded-full ${step >= s ? 'bg-primary' : 'bg-white/10'}`} />
        ))}
      </div>

      {step === 1 && (
        <Card className="p-6 space-y-6 bg-black/40 border-white/10">
          <div className="space-y-2">
            <Label>Bundle Name</Label>
            <Input
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Summer Essentials Pack"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(v: any) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Bundle (Pre-set items)</SelectItem>
                  <SelectItem value="custom">Custom Bundle (Build your own)</SelectItem>
                  <SelectItem value="quantity">Quantity Pack (Multi-buy)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formData.slug || ''}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                placeholder="summer-essentials-pack"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex items-center gap-4">
              {formData.cover_image && (
                <img src={formData.cover_image} className="w-20 h-20 object-cover rounded-md" />
              )}
              <Input type="file" onChange={handleImageUpload} disabled={uploading} />
            </div>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6 space-y-6 bg-black/40 border-white/10">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Bundle Items</h3>
            <Button onClick={addItem} variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
          </div>

          <div className="space-y-4">
            {bundleItems.map((item, index) => (
              <div key={index} className="flex gap-4 items-start p-4 bg-white/5 rounded-lg border border-white/5">
                <div className="flex-1 space-y-4">
                  {formData.type === 'custom' && (
                    <div className="space-y-2">
                      <Label>Slot Name</Label>
                      <Input
                        value={item.slot_name || ''}
                        onChange={e => updateItem(index, 'slot_name', e.target.value)}
                        placeholder="e.g., Select a Hoodie"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    {/* Category Selection */}
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={item.category_id || ''}
                        onValueChange={v => updateItem(index, 'category_id', v)}
                      >
                        <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                        <SelectContent>
                          {categories.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Product Selection (Filtered) */}
                    <div className="space-y-2">
                      <Label>Product</Label>
                      <Select
                        value={item.product_id || ''}
                        onValueChange={v => updateItem(index, 'product_id', v)}
                        disabled={!item.category_id}
                      >
                        <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                        <SelectContent>
                          {products
                            .filter(p => p.category_id === item.category_id)
                            .map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Variant Selection (Filtered) */}
                    {formData.type === 'fixed' && (
                      <div className="space-y-2">
                        <Label>Variant</Label>
                        <Select
                          value={item.variant_id || ''}
                          onValueChange={v => updateItem(index, 'variant_id', v)}
                          disabled={!item.product_id}
                        >
                          <SelectTrigger><SelectValue placeholder="Select Variant" /></SelectTrigger>
                          <SelectContent>
                            {products.find(p => p.id === item.product_id)?.variants?.map(v => (
                              <SelectItem key={v.id} value={v.id}>{v.color} - {v.size}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="w-32 space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={e => updateItem(index, 'quantity', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeItem(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="p-6 space-y-6 bg-black/40 border-white/10">
          <h3 className="text-xl font-bold">Pricing & Activation</h3>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Price Type</Label>
              <Select
                value={formData.price_type}
                onValueChange={(v: any) => setFormData({ ...formData, price_type: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Price (₹)</SelectItem>
                  <SelectItem value="percentage_discount">Percentage Discount (%)</SelectItem>
                  <SelectItem value="fixed_discount">Fixed Amount Off (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                type="number"
                value={formData.price_value || ''}
                onChange={e => setFormData({ ...formData, price_value: parseFloat(e.target.value) })}
                placeholder={formData.price_type === 'percentage_discount' ? '15' : '999'}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <Label htmlFor="is_active">Activate Bundle immediately</Label>
          </div>
        </Card>
      )}

      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Previous
        </Button>

        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)} className="bg-primary text-black">
            Next <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={saveBundle} className="bg-green-500 hover:bg-green-600 text-white" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" /> Save Bundle
          </Button>
        )}
      </div>
    </div>
  );
};

export default BundleManager;
