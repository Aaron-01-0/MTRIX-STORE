import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { useStorageUpload } from '@/hooks/useStorageUpload';

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  bundle_price: number;
  is_active: boolean;
  display_order: number;
}

interface BundleItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    name: string;
  };
}

const BundleManager = () => {
  const { toast } = useToast();
  const { uploadFile, deleteFile, uploading } = useStorageUpload();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [editingBundle, setEditingBundle] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    bundle_price: '',
    image_url: '',
    display_order: 0
  });
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{ product_id: string; quantity: number }[]>([]);
  const [bundleItems, setBundleItems] = useState<{ [key: string]: BundleItem[] }>({});

  useEffect(() => {
    fetchBundles();
    fetchProducts();
  }, []);

  const fetchBundles = async () => {
    const { data, error } = await supabase
      .from('bundles')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching bundles:', error);
      return;
    }

    setBundles(data || []);
    
    // Fetch items for each bundle
    data?.forEach(bundle => fetchBundleItems(bundle.id));
  };

  const fetchBundleItems = async (bundleId: string) => {
    const { data, error } = await supabase
      .from('bundle_items')
      .select(`
        id,
        product_id,
        quantity,
        products:product_id (name)
      `)
      .eq('bundle_id', bundleId);

    if (!error && data) {
      setBundleItems(prev => ({ ...prev, [bundleId]: data as any }));
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, base_price')
      .eq('is_active', true);

    if (!error) {
      setProducts(data || []);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadFile(file, {
      bucket: 'hero-images',
      folder: 'bundles'
    });

    if (url) {
      setFormData(prev => ({ ...prev, image_url: url }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.bundle_price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingBundle) {
        const { error } = await supabase
          .from('bundles')
          .update({
            name: formData.name,
            description: formData.description,
            bundle_price: parseFloat(formData.bundle_price),
            image_url: formData.image_url,
            display_order: formData.display_order
          })
          .eq('id', editingBundle);

        if (error) throw error;

        // Update bundle items
        await supabase
          .from('bundle_items')
          .delete()
          .eq('bundle_id', editingBundle);

        if (selectedProducts.length > 0) {
          await supabase
            .from('bundle_items')
            .insert(selectedProducts.map(p => ({
              bundle_id: editingBundle,
              product_id: p.product_id,
              quantity: p.quantity
            })));
        }
      } else {
        const { data: newBundle, error } = await supabase
          .from('bundles')
          .insert({
            name: formData.name,
            description: formData.description,
            bundle_price: parseFloat(formData.bundle_price),
            image_url: formData.image_url,
            display_order: formData.display_order
          })
          .select()
          .single();

        if (error) throw error;

        if (newBundle && selectedProducts.length > 0) {
          await supabase
            .from('bundle_items')
            .insert(selectedProducts.map(p => ({
              bundle_id: newBundle.id,
              product_id: p.product_id,
              quantity: p.quantity
            })));
        }
      }

      toast({
        title: "Success",
        description: editingBundle ? "Bundle updated" : "Bundle created"
      });

      resetForm();
      fetchBundles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string, imageUrl: string | null) => {
    if (!confirm('Are you sure you want to delete this bundle?')) return;

    try {
      if (imageUrl) {
        await deleteFile(imageUrl, 'hero-images');
      }

      const { error } = await supabase
        .from('bundles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bundle deleted"
      });

      fetchBundles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (bundle: Bundle) => {
    setEditingBundle(bundle.id);
    setFormData({
      name: bundle.name,
      description: bundle.description || '',
      bundle_price: bundle.bundle_price.toString(),
      image_url: bundle.image_url || '',
      display_order: bundle.display_order
    });
    
    const items = bundleItems[bundle.id] || [];
    setSelectedProducts(items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity
    })));
  };

  const resetForm = () => {
    setEditingBundle(null);
    setFormData({
      name: '',
      description: '',
      bundle_price: '',
      image_url: '',
      display_order: 0
    });
    setSelectedProducts([]);
  };

  const addProduct = () => {
    setSelectedProducts([...selectedProducts, { product_id: '', quantity: 1 }]);
  };

  const removeProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: 'product_id' | 'quantity', value: any) => {
    const updated = [...selectedProducts];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedProducts(updated);
  };

  return (
    <Card className="bg-mtrix-dark border-mtrix-gray">
      <CardHeader>
        <CardTitle className="text-foreground">Bundle & Pack Manager</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 p-4 bg-background/50 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Bundle Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter bundle name"
              />
            </div>
            <div>
              <Label>Bundle Price *</Label>
              <Input
                type="number"
                value={formData.bundle_price}
                onChange={(e) => setFormData({ ...formData, bundle_price: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Bundle description"
            />
          </div>

          <div>
            <Label>Bundle Image</Label>
            <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
            {formData.image_url && (
              <img src={formData.image_url} alt="Preview" className="mt-2 h-20 object-cover rounded" />
            )}
          </div>

          <div>
            <Label>Display Order</Label>
            <Input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Products in Bundle</Label>
              <Button size="sm" onClick={addProduct}>
                <Plus className="w-4 h-4 mr-1" /> Add Product
              </Button>
            </div>
            {selectedProducts.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <select
                  className="flex-1 p-2 rounded bg-background border border-input"
                  value={item.product_id}
                  onChange={(e) => updateProduct(index, 'product_id', e.target.value)}
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <Input
                  type="number"
                  className="w-24"
                  value={item.quantity}
                  onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value))}
                  min="1"
                />
                <Button size="sm" variant="destructive" onClick={() => removeProduct(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={uploading}>
              {editingBundle ? <><Save className="w-4 h-4 mr-2" /> Update</> : <><Plus className="w-4 h-4 mr-2" /> Create</>}
            </Button>
            {editingBundle && (
              <Button variant="outline" onClick={resetForm}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          {bundles.map(bundle => (
            <div key={bundle.id} className="p-4 bg-background/50 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  {bundle.image_url && (
                    <img src={bundle.image_url} alt={bundle.name} className="w-24 h-24 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{bundle.name}</h3>
                    <p className="text-sm text-muted-foreground">{bundle.description}</p>
                    <p className="text-lg font-bold text-primary mt-2">₹{bundle.bundle_price}</p>
                    {bundleItems[bundle.id] && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Products:</p>
                        <ul className="text-sm text-muted-foreground">
                          {bundleItems[bundle.id].map(item => (
                            <li key={item.id}>
                              {item.products.name} (Qty: {item.quantity})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(bundle)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(bundle.id, bundle.image_url)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BundleManager;
