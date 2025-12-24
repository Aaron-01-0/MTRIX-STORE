import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Upload, Save, X, Wand2, Image as ImageIcon, Layers, Settings, History, FileSpreadsheet } from 'lucide-react';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { Badge } from '@/components/ui/badge';
import StockHistoryViewer from './StockHistoryViewer';
import { CsvImportDialog } from './CsvImportDialog';
import { useProductVariants } from '@/hooks/useProductVariants';
import { useQueryClient } from '@tanstack/react-query';

const SIZE_PRESETS: Record<string, string[]> = {
  'Apparel': ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  'Wall Art': ['A5', 'A4', 'A3', '12x18', '18x24', '24x36'],
  'Drinkware': ['11 oz', '15 oz', '20 oz'],
  'Accessories': ['Standard Size'],
};

interface ProductVariant {
  id: string;
  product_id: string;
  color: string | null;
  size: string;
  absolute_price: number;
  stock_quantity: number;
  sku: string;
  image_url?: string;
  is_active: boolean;
  attribute_json?: Record<string, string>;
}

interface ProductAttribute {
  id: string;
  name: string;
  display_order: number;
  attribute_values: {
    id: string;
    value: string;
    display_order: number;
  }[];
}

interface Props {
  productId: string;
  productSku?: string;
  productName?: string;
  basePrice?: number;
  variantType?: 'single' | 'multi';
}

export const ProductVariantManager = ({ productId, productSku, productName, basePrice, variantType }: Props) => {
  const { toast } = useToast();
  const { uploadFile, uploading } = useStorageUpload();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useProductVariants(productId);

  // Derived state from React Query
  const variants = data?.variants || [];
  const attributes = data?.attributes || [];
  const productCategory = data?.category || '';
  const loading = isLoading;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isAttributesOpen, setIsAttributesOpen] = useState(false);

  const [historyVariantId, setHistoryVariantId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCsvOpen, setIsCsvOpen] = useState(false);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProductVariant>>({});

  // New variant form state
  const [newVariant, setNewVariant] = useState({
    color: '',
    size: '',
    absolute_price: '',
    stock_quantity: '',
    sku: '',
    image_url: '',
    attribute_json: {}
  });

  // Bulk form state
  const [bulkForm, setBulkForm] = useState({
    colors: '',
    sizes: '',
    price: '',
    stock: ''
  });

  const [newAttributeName, setNewAttributeName] = useState('');
  const [newValueInputs, setNewValueInputs] = useState<Record<string, string>>({});

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['variants', productId] });
  };

  const generateSku = () => {
    const base = productSku || productName?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 6) || 'VAR';
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    let attributesSuffix = '';
    if (variantType === 'multi' && newVariant.attribute_json) {
      // Append first 2 letters of each attribute value
      Object.values(newVariant.attribute_json).forEach(val => {
        if (typeof val === 'string') attributesSuffix += `-${val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 3)}`;
      });
    } else {
      if (newVariant.color) attributesSuffix += `-${newVariant.color.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 3)}`;
      if (newVariant.size) attributesSuffix += `-${newVariant.size.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`;
    }

    setNewVariant(prev => ({ ...prev, sku: `${base}${attributesSuffix}-${random}` }));
  };



  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isNew: boolean = true, variantId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = await uploadFile(file, { bucket: 'product-images' });
    if (!imageUrl) return;

    if (isNew) {
      setNewVariant(prev => ({ ...prev, image_url: imageUrl }));
    } else if (variantId) {
      await updateVariantField(variantId, 'image_url', imageUrl);
    }
  };

  const addVariant = async () => {
    if (variantType === 'multi') {
      if (!newVariant.attribute_json || Object.keys(newVariant.attribute_json).length < attributes.length) {
        toast({ title: "Validation Error", description: "Select values for all attributes", variant: "destructive" });
        return;
      }
    } else {
      if (!newVariant.size) {
        toast({ title: "Validation Error", description: "Size is required", variant: "destructive" });
        return;
      }
    }

    if (!newVariant.absolute_price || !newVariant.sku) {
      toast({ title: "Validation Error", description: "Price and SKU are required", variant: "destructive" });
      return;
    }

    try {
      const payload: any = {
        product_id: productId,
        price: parseFloat(newVariant.absolute_price),
        stock_quantity: parseInt(newVariant.stock_quantity) || 0,
        sku: newVariant.sku,
        image_url: newVariant.image_url,
        is_active: true
      };

      if (variantType === 'multi') {
        payload.variant_type = 'multi';
        payload.attribute_json = newVariant.attribute_json;
        payload.variant_name = Object.values(newVariant.attribute_json || {}).join(' / ');
        // Fallbacks
        payload.size = newVariant.attribute_json?.['Size'] || 'Standard';
        payload.color = newVariant.attribute_json?.['Color'] || null;
      } else {
        payload.color = newVariant.color || null;
        payload.size = newVariant.size;
        payload.variant_type = newVariant.color ? 'color-size' : 'size';
        payload.variant_name = newVariant.color ? `${newVariant.color} - ${newVariant.size}` : newVariant.size;
      }

      const { error } = await supabase.from('product_variants').insert(payload);

      if (error) throw error;

      toast({ title: "Success", description: "Variant added successfully" });
      setNewVariant({ color: '', size: '', absolute_price: '', stock_quantity: '', sku: '', image_url: '', attribute_json: {} });
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add variant", variant: "destructive" });
    }
  };

  const handleBulkGenerate = async () => {
    if (!bulkForm.price || !bulkForm.stock) {
      toast({ title: "Error", description: "Price and Stock are required", variant: "destructive" });
      return;
    }

    let variantsToInsert = [];

    if (variantType === 'multi') {
      // Matrix Generation Logic
      if (attributes.length === 0) {
        toast({ title: "Error", description: "Configure attributes first", variant: "destructive" });
        return;
      }

      // Check if all attributes have values
      const emptyAttributes = attributes.filter(a => !a.attribute_values || a.attribute_values.length === 0);
      if (emptyAttributes.length > 0) {
        toast({ title: "Error", description: `Add values for: ${emptyAttributes.map(a => a.name).join(', ')}`, variant: "destructive" });
        return;
      }

      // Helper to generate cartesian product
      const cartesian = (args: any[][]) => {
        const r: any[][] = [];
        const max = args.length - 1;
        function helper(arr: any[], i: number) {
          for (let j = 0, l = args[i].length; j < l; j++) {
            const a = arr.slice(0); // clone arr
            a.push(args[i][j]);
            if (i === max) r.push(a);
            else helper(a, i + 1);
          }
        }
        helper([], 0);
        return r;
      };

      const attributeValues = attributes.map(a => a.attribute_values.map(v => ({ name: a.name, value: v.value })));
      const combinations = cartesian(attributeValues);

      console.log('Generating combinations:', combinations);

      variantsToInsert = combinations.map(combo => {
        const attributeMap: Record<string, string> = {};
        combo.forEach((c: any) => { attributeMap[c.name] = c.value; });

        // Generate SKU and Name
        // SKU: PROD-ATTR1-ATTR2...
        const suffix = combo.map((c: any) => c.value.toUpperCase().slice(0, 3)).join('-');
        const sku = productSku ? `${productSku}-${suffix}` : suffix;

        const name = combo.map((c: any) => c.value).join(' / ');

        return {
          product_id: productId,
          price: parseFloat(bulkForm.price),
          stock_quantity: parseInt(bulkForm.stock),
          sku: sku,
          variant_type: 'multi',
          variant_name: name,
          attribute_json: attributeMap,
          size: attributeMap['Size'] || 'Standard', // Fallback for backward compatibility/required fields
          color: attributeMap['Color'] || null,
          is_active: true
        };
      });

    } else {
      // Old Color/Size Logic
      if (!bulkForm.sizes) {
        toast({ title: "Error", description: "Sizes are required", variant: "destructive" });
        return;
      }
      const colors = bulkForm.colors ? bulkForm.colors.split(',').map(c => c.trim()).filter(c => c) : [null];
      const sizes = bulkForm.sizes.split(',').map(s => s.trim()).filter(s => s);

      if (sizes.length === 0) {
        toast({ title: "Error", description: "Enter at least one size", variant: "destructive" });
        return;
      }

      for (const color of colors) {
        for (const size of sizes) {
          let sku = productSku ? `${productSku}-` : '';
          if (color) sku += `${color.toUpperCase().slice(0, 3)}-`;
          sku += size.toUpperCase();
          if (!productSku) sku += `-${Math.floor(Math.random() * 1000)}`;

          variantsToInsert.push({
            product_id: productId,
            color: color,
            size: size,
            price: parseFloat(bulkForm.price),
            stock_quantity: parseInt(bulkForm.stock),
            sku: sku,
            variant_type: color ? 'color-size' : 'size',
            variant_name: color ? `${color} - ${size}` : size,
            is_active: true
          });
        }
      }
    }

    try {
      const { error } = await supabase.from('product_variants').insert(variantsToInsert);
      if (error) throw error;

      toast({ title: "Success", description: `Generated ${variantsToInsert.length} variants` });
      setIsBulkOpen(false);
      setBulkForm({ colors: '', sizes: '', price: '', stock: '' });
      refreshData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to generate variants", variant: "destructive" });
    }
  };

  // ... (rest of code) ...


  const startEditing = (variant: ProductVariant) => {
    setEditingId(variant.id);
    setEditForm(variant);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEditing = async () => {
    if (!editingId || !editForm) return;

    try {
      const { error } = await supabase.from('product_variants').update({
        color: editForm.color || null,
        size: editForm.size,
        price: editForm.absolute_price,
        stock_quantity: editForm.stock_quantity,
        sku: editForm.sku,
        variant_name: editForm.color ? `${editForm.color} - ${editForm.size}` : editForm.size
      }).eq('id', editingId);

      if (error) throw error;

      toast({ title: "Success", description: "Variant updated" });
      setEditingId(null);
      refreshData();
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to update variant", variant: "destructive" });
    }
  };

  const updateVariantField = async (id: string, field: string, value: any) => {
    try {
      const { error } = await supabase.from('product_variants').update({ [field]: value }).eq('id', id);
      if (error) throw error;
      refreshData();
    } catch (error) {
      console.error('Error updating variant:', error);
      toast({ title: "Error", description: "Update failed", variant: "destructive" });
    }
  };

  const deleteVariant = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;
    try {
      const { error } = await supabase.from('product_variants').delete().eq('id', variantId);
      if (error) throw error;
      toast({ title: "Success", description: "Variant deleted" });
      refreshData();
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to delete variant", variant: "destructive" });
    }
  };

  const handleAddAttribute = async (name: string) => {
    if (!name.trim()) return;
    try {
      const { error } = await supabase.from('product_attributes').insert({
        product_id: productId,
        name: name.trim(),
        display_order: attributes.length
      });
      if (error) throw error;
      refreshData();
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to add attribute", variant: "destructive" });
    }
  };

  const handleDeleteAttribute = async (id: string) => {
    try {
      const { error } = await supabase.from('product_attributes').delete().eq('id', id);
      if (error) throw error;
      refreshData();
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to delete attribute", variant: "destructive" });
    }
  };

  const handleAddValue = async (attributeId: string, value: string) => {
    if (!value.trim()) return;
    try {
      const { error } = await supabase.from('attribute_values').insert({
        attribute_id: attributeId,
        value: value.trim(),
        display_order: 0 // You might want to calculate this
      });
      if (error) throw error;
      refreshData();
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to add value", variant: "destructive" });
    }
  };

  const handleDeleteValue = async (id: string) => {
    try {
      const { error } = await supabase.from('attribute_values').delete().eq('id', id);
      if (error) throw error;
      refreshData();
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to delete value", variant: "destructive" });
    }
  };

  const onAddValue = (attrId: string) => {
    const val = newValueInputs[attrId];
    if (val) {
      handleAddValue(attrId, val);
      setNewValueInputs(prev => ({ ...prev, [attrId]: '' }));
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading variants...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-orbitron font-bold text-white">Product Variants</h3>
          <p className="text-sm text-muted-foreground">Manage colors, sizes, and stock levels.</p>
        </div>

        <div className="flex gap-2">
          {variantType === 'multi' && (
            <Dialog open={isAttributesOpen} onOpenChange={setIsAttributesOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                  <Settings className="w-4 h-4 mr-2" /> Configure Attributes
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-mtrix-black border-white/10 text-white sm:max-w-[600px]">
                {/* ... existing content ... */}
              </DialogContent>
            </Dialog>
          )}



          <Button
            variant="outline"
            onClick={() => setIsCsvOpen(true)}
            className="border-green-500/50 text-green-500 hover:bg-green-500/10"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Import CSV
          </Button>

          <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                <Layers className="w-4 h-4 mr-2" /> Bulk Generate
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-mtrix-black border-white/10 text-white sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-gradient-gold">Bulk Generate Variants</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {variantType === 'multi' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <Label className="text-muted-foreground mb-2 block">Configuration Summary</Label>
                      <ul className="space-y-1 text-sm text-white">
                        {attributes.map(a => (
                          <li key={a.id} className="flex justify-between">
                            <span>{a.name}:</span>
                            <span className="text-primary">{a.attribute_values?.length || 0} values</span>
                          </li>
                        ))}
                      </ul>
                      {attributes.length === 0 && <p className="text-sm text-red-400">No attributes configured.</p>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This will generate all possible combinations of the configured attributes.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Colors (comma separated, optional)</Label>
                      <Input
                        value={bulkForm.colors}
                        onChange={(e) => setBulkForm({ ...bulkForm, colors: e.target.value })}
                        placeholder="Red, Blue, Black (Leave empty for no color)"
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sizes (comma separated)</Label>
                      <Input
                        value={bulkForm.sizes}
                        onChange={(e) => setBulkForm({ ...bulkForm, sizes: e.target.value })}
                        placeholder="S, M, L, XL"
                        className="bg-white/5 border-white/10"
                      />
                      {productCategory && SIZE_PRESETS[productCategory] && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {SIZE_PRESETS[productCategory].map(size => (
                            <Badge
                              key={size}
                              variant="outline"
                              className="cursor-pointer hover:bg-primary/20 hover:border-primary/50 transition-colors"
                              onClick={() => {
                                const current = bulkForm.sizes ? bulkForm.sizes.split(',').map(s => s.trim()).filter(Boolean) : [];
                                if (!current.includes(size)) {
                                  setBulkForm({ ...bulkForm, sizes: [...current, size].join(', ') });
                                }
                              }}
                            >
                              + {size}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Base Price</Label>
                    <Input
                      type="number"
                      value={bulkForm.price}
                      onChange={(e) => setBulkForm({ ...bulkForm, price: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Base Stock</Label>
                    <Input
                      type="number"
                      value={bulkForm.stock}
                      onChange={(e) => setBulkForm({ ...bulkForm, stock: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
                <Button onClick={handleBulkGenerate} className="w-full bg-primary text-black hover:bg-primary/90 mt-4">
                  Generate Variants
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-gold text-mtrix-black hover:shadow-gold">
                <Plus className="w-4 h-4 mr-2" /> Add Variant
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-mtrix-black border-white/10 text-white sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-gradient-gold">Add New Variant</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {variantType === 'multi' ? (
                  <div className="grid grid-cols-2 gap-4">
                    {attributes.map(attr => (
                      <div key={attr.id} className="space-y-2">
                        <Label>{attr.name}</Label>
                        <select
                          className="w-full bg-white/5 border border-white/10 rounded-md h-10 px-3 text-sm"
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewVariant(prev => {
                              const currentAttrs = prev.attribute_json || {};
                              return { ...prev, attribute_json: { ...currentAttrs, [attr.name]: val } };
                            });
                          }}
                        >
                          <option value="">Select {attr.name}</option>
                          {attr.attribute_values.map(v => (
                            <option key={v.id} value={v.value}>{v.value}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Color (Optional)</Label>
                      <Input
                        value={newVariant.color}
                        onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                        className="bg-white/5 border-white/10"
                        placeholder="e.g. Red"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Size</Label>
                      <Input
                        value={newVariant.size}
                        onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                        className="bg-white/5 border-white/10"
                        placeholder="e.g. XL"
                      />
                    </div>
                  </div>
                )}

                {variantType !== 'multi' && productCategory && SIZE_PRESETS[productCategory] && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Suggested Sizes</Label>
                    <div className="flex flex-wrap gap-2">
                      {SIZE_PRESETS[productCategory].map(size => (
                        <Badge
                          key={size}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/20 hover:border-primary/50 transition-colors"
                          onClick={() => setNewVariant({ ...newVariant, size })}
                        >
                          {size}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>SKU</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newVariant.sku}
                      onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="PROD-RED-XL"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={generateSku}
                      title="Auto-generate SKU"
                      className="border-white/10 hover:bg-white/5"
                    >
                      <Wand2 className="w-4 h-4 text-primary" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price (₹)</Label>
                    <Input
                      type="number"
                      value={newVariant.absolute_price}
                      onChange={(e) => setNewVariant({ ...newVariant, absolute_price: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      value={newVariant.stock_quantity}
                      onChange={(e) => setNewVariant({ ...newVariant, stock_quantity: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Image</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden group">
                      {newVariant.image_url ? (
                        <img src={newVariant.image_url} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleImageUpload(e, true)}
                        disabled={uploading}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Click to upload variant specific image
                    </div>
                  </div>
                </div>

                <Button onClick={addVariant} className="w-full bg-primary text-black hover:bg-primary/90 mt-4">
                  Create Variant
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden bg-black/40 backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white">Image</TableHead>
              <TableHead className="text-white">SKU</TableHead>
              <TableHead className="text-white">Attributes</TableHead>
              <TableHead className="text-white">Price</TableHead>
              <TableHead className="text-white">Stock</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-right text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No variants found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              variants.map((variant) => (
                <TableRow key={variant.id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell>
                    <div className="relative w-10 h-10 rounded-md border border-white/10 bg-white/5 overflow-hidden group cursor-pointer">
                      {variant.image_url ? (
                        <img src={variant.image_url} alt={variant.sku} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleImageUpload(e, false, variant.id)}
                        disabled={uploading}
                      />
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {editingId === variant.id ? (
                      <Input
                        value={editForm.sku}
                        onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                        className="h-8 w-32 bg-black border-white/20"
                      />
                    ) : variant.sku}
                  </TableCell>

                  <TableCell>
                    {editingId === variant.id ? (
                      <div className="flex gap-2">
                        {/* Inline editing for legacy/simple variants */}
                        {variantType !== 'multi' && (
                          <>
                            <Input
                              value={editForm.color || ''}
                              onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                              className="h-8 w-20 bg-black border-white/20"
                              placeholder="Color"
                            />
                            <Input
                              value={editForm.size}
                              onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                              className="h-8 w-16 bg-black border-white/20"
                              placeholder="Size"
                            />
                          </>
                        )}
                        {/* Inline editing for multi-attribute not fully supported yet, show read-only badges */}
                        {variantType === 'multi' && variant.attribute_json && Object.entries(variant.attribute_json).map(([k, v]) => (
                          <Badge key={k} variant="secondary" className="bg-white/10">{v}</Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {variant.attribute_json ? (
                          Object.entries(variant.attribute_json).map(([key, val]) => (
                            <Badge key={key} variant="outline" className="border-white/10 bg-white/5" title={key}>
                              {val}
                            </Badge>
                          ))
                        ) : (
                          <>
                            {variant.color ? (
                              <Badge variant="outline" className="border-white/10 bg-white/5">{variant.color}</Badge>
                            ) : (
                              <Badge variant="outline" className="border-white/10 bg-white/5 text-muted-foreground">No Color</Badge>
                            )}
                            <Badge variant="outline" className="border-white/10 bg-white/5">{variant.size}</Badge>
                          </>
                        )}
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    {editingId === variant.id ? (
                      <Input
                        type="number"
                        value={editForm.absolute_price}
                        onChange={(e) => setEditForm({ ...editForm, absolute_price: parseFloat(e.target.value) })}
                        className="h-8 w-24 bg-black border-white/20"
                      />
                    ) : (
                      <span className="text-primary font-medium">₹{variant.absolute_price}</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {editingId === variant.id ? (
                      <Input
                        type="number"
                        value={editForm.stock_quantity}
                        onChange={(e) => setEditForm({ ...editForm, stock_quantity: parseInt(e.target.value) })}
                        className="h-8 w-20 bg-black border-white/20"
                      />
                    ) : (
                      <span className={variant.stock_quantity < 10 ? "text-red-400" : "text-green-400"}>
                        {variant.stock_quantity}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    <Switch
                      checked={variant.is_active}
                      onCheckedChange={(checked) => updateVariantField(variant.id, 'is_active', checked)}
                    />
                  </TableCell>

                  <TableCell className="text-right">
                    {editingId === variant.id ? (
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={saveEditing} className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-400/10">
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setHistoryVariantId(variant.id);
                            setIsHistoryOpen(true);
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10"
                          title="View Stock History"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(variant)}
                          className="h-8 px-2 text-muted-foreground hover:text-white"
                        >
                          Edit
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteVariant(variant.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <StockHistoryViewer
        variantId={historyVariantId}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        variantName={
          variants.find(v => v.id === historyVariantId)?.variant_name
        }
      />
    </div>
  );
};