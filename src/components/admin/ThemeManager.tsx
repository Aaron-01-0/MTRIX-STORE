import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Palette, MoveUp, MoveDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { Tables } from '@/integrations/supabase/types';

type Theme = Tables<'themes'>;

const ThemeManager = () => {
  const { toast } = useToast();
  const { uploadFile, uploading } = useStorageUpload();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    is_active: true,
    display_order: 0
  });

  useEffect(() => {
    loadThemes();

    // Set up real-time subscription
    const channel = supabase
      .channel('themes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'themes'
        },
        () => {
          loadThemes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadThemes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setThemes(data || []);
    } catch (error) {
      console.error('Error loading themes:', error);
      toast({
        title: "Error",
        description: "Failed to load themes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      is_active: true,
      display_order: themes.length
    });
    setEditingTheme(null);
  };

  const handleImageUpload = async (file: File) => {
    const url = await uploadFile(file, {
      bucket: 'hero-images',
      folder: 'themes',
      maxSizeMB: 5
    });

    if (url) {
      setFormData(prev => ({ ...prev, image_url: url }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        title: "Error",
        description: "Theme name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const themeData = {
        name: formData.name,
        description: formData.description || null,
        image_url: formData.image_url || null,
        is_active: formData.is_active,
        display_order: formData.display_order
      };

      let result;
      if (editingTheme) {
        result = await supabase
          .from('themes')
          .update(themeData)
          .eq('id', editingTheme.id);
      } else {
        result = await supabase
          .from('themes')
          .insert([themeData]);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: `Theme ${editingTheme ? 'updated' : 'created'} successfully`
      });

      setShowDialog(false);
      resetForm();
      loadThemes();
    } catch (error: any) {
      console.error('Error saving theme:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save theme",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (theme: Theme) => {
    setEditingTheme(theme);
    setFormData({
      name: theme.name,
      description: theme.description || '',
      image_url: theme.image_url || '',
      is_active: theme.is_active,
      display_order: theme.display_order
    });
    setShowDialog(true);
  };

  const handleDelete = async (themeId: string) => {
    if (!confirm('Are you sure you want to delete this theme?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', themeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Theme deleted successfully"
      });

      loadThemes();
    } catch (error: any) {
      console.error('Error deleting theme:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete theme",
        variant: "destructive"
      });
    }
  };

  const moveTheme = async (themeId: string, direction: 'up' | 'down') => {
    const currentTheme = themes.find(t => t.id === themeId);
    if (!currentTheme) return;

    const targetOrder = direction === 'up' 
      ? currentTheme.display_order - 1 
      : currentTheme.display_order + 1;

    const targetTheme = themes.find(t => t.display_order === targetOrder);
    if (!targetTheme) return;

    try {
      await Promise.all([
        supabase
          .from('themes')
          .update({ display_order: targetOrder })
          .eq('id', themeId),
        supabase
          .from('themes')
          .update({ display_order: currentTheme.display_order })
          .eq('id', targetTheme.id)
      ]);

      loadThemes();
    } catch (error: any) {
      console.error('Error moving theme:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to move theme",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="bg-mtrix-black border-mtrix-gray">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-gradient-gold">Themes</CardTitle>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button
              onClick={() => { resetForm(); setShowDialog(true); }}
              className="bg-gradient-gold text-mtrix-black hover:shadow-gold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Theme
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl bg-mtrix-dark border-mtrix-gray">
            <DialogHeader>
              <DialogTitle className="text-gradient-gold">
                {editingTheme ? 'Edit Theme' : 'Create New Theme'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Theme Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-mtrix-black border-mtrix-gray"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-mtrix-black border-mtrix-gray"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Theme Image</Label>
                {formData.image_url && (
                  <img 
                    src={formData.image_url} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded mb-2"
                  />
                )}
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-mtrix-black hover:file:bg-primary/80"
                  disabled={uploading}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-gold text-mtrix-black hover:shadow-gold"
                >
                  {editingTheme ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes.map((theme, index) => (
            <div key={theme.id} className="border border-mtrix-gray rounded-lg overflow-hidden">
              {theme.image_url && (
                <img
                  src={theme.image_url}
                  alt={theme.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      {theme.name}
                      {!theme.is_active && (
                        <span className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded">
                          Inactive
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{theme.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveTheme(theme.id, 'up')}
                      disabled={index === 0}
                    >
                      <MoveUp className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveTheme(theme.id, 'down')}
                      disabled={index === themes.length - 1}
                    >
                      <MoveDown className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(theme)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(theme.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {themes.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No themes yet. Create your first one!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeManager;
