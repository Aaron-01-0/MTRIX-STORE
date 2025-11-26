import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { Upload, Save } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Category = Tables<'categories'>;

const CategoryImageManager = () => {
  const { toast } = useToast();
  const { uploadFile, uploading } = useStorageUpload();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (categoryId: string, categoryName: string, file: File) => {
    const url = await uploadFile(file, {
      bucket: 'category-images',
      folder: categoryName.toLowerCase().replace(/\s+/g, '-'),
      maxSizeMB: 5
    });

    if (url) {
      await updateCategoryImage(categoryId, url);
    }
  };

  const updateCategoryImage = async (categoryId: string, imageUrl: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ image_url: imageUrl })
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category image updated successfully"
      });

      loadCategories();
    } catch (error: any) {
      console.error('Error updating category image:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update category image",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="bg-mtrix-black border-mtrix-gray">
      <CardHeader>
        <CardTitle className="text-gradient-gold">Category Images</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div key={category.id} className="border border-mtrix-gray rounded-lg p-4">
              <h3 className="font-semibold mb-2">{category.name}</h3>
              
              {category.image_url && (
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="w-full h-40 object-cover rounded-lg mb-2"
                />
              )}

              <div className="space-y-2">
                <Label htmlFor={`category-${category.id}`}>Upload Image</Label>
                <input
                  id={`category-${category.id}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(category.id, category.name, file);
                    }
                  }}
                  className="block w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-mtrix-black hover:file:bg-primary/80"
                  disabled={uploading}
                />
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No categories found. Create some categories first.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryImageManager;
