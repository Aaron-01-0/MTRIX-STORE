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
import { Trash2, Plus, Upload, Save, X, Wand2, Image as ImageIcon } from 'lucide-react';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { Badge } from '@/components/ui/badge';

interface ProductVariant {
  id: string;
  product_id: string;
  color: string;
  size: string;
  absolute_price: number;
  stock_quantity: number;
  sku: string;
  image_url?: string;
  is_active: boolean;
}

interface Props {
  productId: string;
  productSku?: string; // Passed from parent to help with auto-SKU
}

export const ProductVariantManager = ({ productId, productSku }: Props) => {
  const { toast } = useToast();
  const { uploadFile, uploading } = useStorageUpload();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    image_url: ''
  });

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  const fetchVariants = async () => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setVariants(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load variants",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSku = () => {
    if (!productSku || !newVariant.color || !newVariant.size) {
      toast({
        title: "Info",
        description: "Need Product SKU, Color, and Size to auto-generate",
      });
      return;
    }
    const suffix = `${newVariant.color.toUpperCase().slice(0, 3)}-${newVariant.size.toUpperCase()}`;
    setNewVariant(prev => ({ ...prev, sku: `${productSku}-${suffix}` }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isNew: boolean = true, variantId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = await uploadFile(file, { bucket: 'product-images' });
    if (!imageUrl) return;

    if (isNew) {
      setNewVariant(prev => ({ ...prev, image_url: imageUrl }));
    } else if (variantId) {
      // If inline editing, update immediately
      await updateVariantField(variantId, 'image_url', imageUrl);
    }
  };

  const addVariant = async () => {
    if (!newVariant.color || !newVariant.size || !newVariant.absolute_price || !newVariant.sku) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('product_variants')
        .insert({
          product_id: productId,
          color: newVariant.color,
          size: newVariant.size,
          absolute_price: parseFloat(newVariant.absolute_price),
          stock_quantity: parseInt(newVariant.stock_quantity) || 0,
          sku: newVariant.sku,
          image_url: newVariant.image_url,
          variant_type: 'color-size',
          variant_name: `${newVariant.color} - ${newVariant.size}`,
          is_active: true
        });

      if (error) throw error;

      toast({ title: "Success", description: "Variant added successfully" });
      setNewVariant({
        color: '',
        size: '',
        absolute_price: '',
        stock_quantity: '',
        sku: '',
        image_url: ''
      });
      setIsDialogOpen(false);
      fetchVariants();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add variant",
        variant: "destructive"
      });
    }
  };

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
      const { error } = await supabase
        .from('product_variants')
        .update({
          color: editForm.color,
          size: editForm.size,
          absolute_price: editForm.absolute_price,
          stock_quantity: editForm.stock_quantity,
          sku: editForm.sku,
          variant_name: `${editForm.color} - ${editForm.size}`
        })
        .eq('id', editingId);

      if (error) throw error;

      toast({ title: "Success", description: "Variant updated" });
      setEditingId(null);
      fetchVariants();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update variant",
        variant: "destructive"
      });
    }
  };

  const updateVariantField = async (id: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;

      // Optimistic update or refetch
      fetchVariants();
    } catch (error) {
      console.error('Error updating variant:', error);
      toast({ title: "Error", description: "Update failed", variant: "destructive" });
    }
  };

  const deleteVariant = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId);

      if (error) throw error;

      toast({ title: "Success", description: "Variant deleted" });
      fetchVariants();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete variant",
        variant: "destructive"
      });
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-gold text-mtrix-black hover:shadow-gold">
              <Plus className="w-4 h-4 mr-2" />
              Add Variant
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-mtrix-black border-white/10 text-white sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-gradient-gold">Add New Variant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color</Label>
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
                        <Input
                          value={editForm.color}
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
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Badge variant="outline" className="border-white/10 bg-white/5">{variant.color}</Badge>
                        <Badge variant="outline" className="border-white/10 bg-white/5">{variant.size}</Badge>
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
    </div>
  );
};