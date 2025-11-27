import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, FolderTree, ArrowRight, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type Category = Tables<'categories'>;

const CategoryManager = () => {
  const { toast } = useToast();
  const { uploadFile, uploading } = useStorageUpload();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent_id: null as string | null,
    image_url: '',
    is_active: true,
    meta_title: '',
    meta_description: '',
    display_order: 0
  });

  useEffect(() => {
    loadCategories();
    const channel = supabase.channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, loadCategories)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('categories').select('*').order('display_order', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({ title: "Error", description: "Failed to load categories", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: !editingCategory ? generateSlug(name) : prev.slug // Only auto-generate on create
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      parent_id: null,
      image_url: '',
      is_active: true,
      meta_title: '',
      meta_description: '',
      display_order: 0
    });
    setEditingCategory(null);
  };

  const handleImageUpload = async (file: File) => {
    const url = await uploadFile(file, {
      bucket: 'category-images',
      folder: formData.slug || 'temp',
      maxSizeMB: 5
    });
    if (url) setFormData(prev => ({ ...prev, image_url: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      toast({ title: "Error", description: "Name and Slug are required", variant: "destructive" });
      return;
    }

    try {
      const categoryData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        parent_id: formData.parent_id || null,
        image_url: formData.image_url || null,
        is_active: formData.is_active,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        display_order: formData.display_order || 0
      };

      const { error } = editingCategory
        ? await supabase.from('categories').update(categoryData).eq('id', editingCategory.id)
        : await supabase.from('categories').insert([categoryData]);

      if (error) throw error;

      toast({ title: "Success", description: `Category ${editingCategory ? 'updated' : 'created'} successfully` });
      setShowDialog(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast({ title: "Error", description: error.message || "Failed to save category", variant: "destructive" });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug || '',
      description: category.description || '',
      parent_id: category.parent_id,
      image_url: category.image_url || '',
      is_active: category.is_active || false,
      meta_title: category.meta_title || '',
      meta_description: category.meta_description || '',
      display_order: category.display_order || 0
    });
    setShowDialog(true);
  };

  const handleDelete = async (categoryId: string) => {
    const subcategories = categories.filter(c => c.parent_id === categoryId);
    if (subcategories.length > 0) {
      toast({
        title: "Cannot Delete",
        description: `This category has ${subcategories.length} subcategories. Please move or delete them first.`,
        variant: "destructive"
      });
      return;
    }

    if (!confirm('Are you sure? This action cannot be undone.')) return;

    try {
      const { error } = await supabase.from('categories').delete().eq('id', categoryId);
      if (error) throw error;
      toast({ title: "Success", description: "Category deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const parentCategories = categories.filter(cat => !cat.parent_id);
  const getSubcategories = (parentId: string) => categories.filter(cat => cat.parent_id === parentId);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  return (
    <Card className="bg-mtrix-black border-mtrix-gray">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-gradient-gold text-2xl">Category Management</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">Manage your store's hierarchy (Max 2 Levels)</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-gradient-gold text-mtrix-black hover:shadow-gold">
              <Plus className="w-4 h-4 mr-2" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-mtrix-dark border-mtrix-gray max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gradient-gold">{editingCategory ? 'Edit Category' : 'Create New Category'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={formData.name} onChange={handleNameChange} className="bg-black/20 border-white/10" required />
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL) *</Label>
                  <Input value={formData.slug} onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))} className="bg-black/20 border-white/10" required />
                </div>
                <div className="space-y-2">
                  <Label>Parent Category</Label>
                  <Select value={formData.parent_id || "none"} onValueChange={(v) => setFormData(prev => ({ ...prev, parent_id: v === "none" ? null : v }))}>
                    <SelectTrigger className="bg-black/20 border-white/10"><SelectValue placeholder="Main Category (None)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Main Category (None)</SelectItem>
                      {parentCategories.filter(c => c.id !== editingCategory?.id).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input type="number" value={formData.display_order} onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) }))} className="bg-black/20 border-white/10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="bg-black/20 border-white/10" rows={3} />
              </div>

              <div className="space-y-4 border-t border-white/10 pt-4">
                <h4 className="font-semibold text-primary">SEO Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Meta Title</Label>
                    <Input value={formData.meta_title} onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))} className="bg-black/20 border-white/10" placeholder="SEO Title" />
                  </div>
                  <div className="space-y-2">
                    <Label>Meta Description</Label>
                    <Input value={formData.meta_description} onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))} className="bg-black/20 border-white/10" placeholder="SEO Description" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-white/10 pt-4">
                <Label>Category Image</Label>
                <div className="flex items-center gap-4">
                  {formData.image_url && <img src={formData.image_url} alt="Preview" className="w-20 h-20 object-cover rounded border border-white/10" />}
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} className="text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-black hover:file:bg-primary/80 cursor-pointer" disabled={uploading} />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <div className="flex items-center space-x-2">
                  <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData(prev => ({ ...prev, is_active: c }))} />
                  <Label>Active Status</Label>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setShowDialog(false)}>Cancel</Button>
                  <Button type="submit" className="bg-gradient-gold text-mtrix-black">{editingCategory ? 'Update Category' : 'Create Category'}</Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {parentCategories.map((parent) => (
            <div key={parent.id} className={cn("border rounded-lg p-4 transition-all", parent.is_active ? "border-mtrix-gray bg-black/20" : "border-red-900/30 bg-red-900/5 opacity-70")}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                    {parent.image_url ? <img src={parent.image_url} className="w-full h-full object-cover" /> : <FolderTree className="w-6 h-6 text-muted-foreground" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {parent.name}
                      {!parent.is_active && <Badge variant="destructive" className="text-[10px]">Hidden</Badge>}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">/{parent.slug}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(parent)}><Edit className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => handleDelete(parent.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>

              {/* Subcategories */}
              <div className="pl-16 space-y-2">
                {getSubcategories(parent.id).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className={cn("text-sm font-medium", !sub.is_active && "text-muted-foreground line-through")}>{sub.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">/{sub.slug}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEdit(sub)}><Edit className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => handleDelete(sub.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
                {getSubcategories(parent.id).length === 0 && (
                  <div className="text-xs text-muted-foreground italic pl-6">No subcategories</div>
                )}
              </div>
            </div>
          ))}
          {categories.length === 0 && <div className="text-center py-12 text-muted-foreground">No categories found. Start by adding one.</div>}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryManager;
