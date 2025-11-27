import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Trash2, Star, Image, MoveUp, MoveDown, Crop } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';
import { ImageCropper } from '@/components/ImageCropper';
import { useStorageUpload } from '@/hooks/useStorageUpload';

type ProductImage = Tables<'product_images'>;

interface ProductImageManagerProps {
  productId: string;
}

const ProductImageManager = ({ productId }: ProductImageManagerProps) => {
  const { toast } = useToast();
  const { uploadFile, uploading } = useStorageUpload();
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const [newImage, setNewImage] = useState({
    image_url: '',
    alt_text: '',
    is_main: false,
    variant_type: 'color',
    variant_value: '',
    display_order: 0
  });

  // Fetch available colors from variants
  const [availableColors, setAvailableColors] = useState<string[]>([]);

  useEffect(() => {
    loadColors();
  }, [productId]);

  const loadColors = async () => {
    const { data } = await supabase
      .from('product_variants')
      .select('color')
      .eq('product_id', productId);

    if (data) {
      const uniqueColors = Array.from(new Set(data.map(v => v.color)));
      setAvailableColors(uniqueColors);
    }
  };

  useEffect(() => {
    loadImages();
  }, [productId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      logger.error('Failed to load product images', error);
      toast({
        title: "Error",
        description: "Failed to load product images",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openCropper = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCurrentFile(file);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCroppedImage = async (croppedBlob: Blob) => {
    setShowCropper(false);

    if (!currentFile) return;

    try {
      // Create a File from the Blob
      const croppedFile = new File([croppedBlob], currentFile.name, { type: currentFile.type });

      // Upload using the storage hook
      const publicUrl = await uploadFile(croppedFile, {
        bucket: 'product-images',
        maxSizeMB: 5
      });

      if (!publicUrl) return;

      const { error } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: publicUrl,
          alt_text: currentFile.name.replace(/\.[^/.]+$/, ''),
          is_main: images.length === 0,
          display_order: images.length,
          variant_type: null,
          variant_value: null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });

      loadImages();
    } catch (error: any) {
      logger.error('Failed to upload image', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setCurrentFile(null);
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // For single file, open cropper
    if (files.length === 1) {
      openCropper(files[0]);
      return;
    }

    // For multiple files, upload directly using storage hook
    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const publicUrl = await uploadFile(file, {
          bucket: 'product-images',
          maxSizeMB: 5
        });

        if (!publicUrl) throw new Error('Upload failed');

        return {
          product_id: productId,
          image_url: publicUrl,
          alt_text: file.name.replace(/\.[^/.]+$/, ''),
          is_main: images.length === 0 && index === 0,
          display_order: images.length + index,
          variant_type: null,
          variant_value: null
        };
      });

      const newImages = await Promise.all(uploadPromises);

      const { error } = await supabase
        .from('product_images')
        .insert(newImages);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${files.length} images uploaded successfully`
      });

      loadImages();
    } catch (error: any) {
      logger.error('Failed to upload images', error);
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive"
      });
    }
  };

  const addImageByUrl = async () => {
    if (!newImage.image_url) {
      toast({
        title: "Error",
        description: "Please enter an image URL",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('product_images')
        .insert([{
          product_id: productId,
          image_url: newImage.image_url,
          alt_text: newImage.alt_text || 'Product image',
          is_main: newImage.is_main,
          display_order: newImage.display_order || images.length,
          variant_type: newImage.variant_type || null,
          variant_value: newImage.variant_value || null
        }])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Image added successfully"
      });

      setNewImage({
        image_url: '',
        alt_text: '',
        is_main: false,
        variant_type: '',
        variant_value: '',
        display_order: 0
      });

      loadImages();
    } catch (error: any) {
      console.error('Error adding image:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add image",
        variant: "destructive"
      });
    }
  };

  const updateImage = async (imageId: string, updates: Partial<ProductImage>) => {
    try {
      const { error } = await supabase
        .from('product_images')
        .update(updates)
        .eq('id', imageId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Image updated successfully"
      });

      loadImages();
    } catch (error: any) {
      console.error('Error updating image:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update image",
        variant: "destructive"
      });
    }
  };

  const deleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      // Get the image to extract the storage path
      const image = images.find(img => img.id === imageId);

      // Delete from database
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      // Try to delete from storage if it's a storage URL
      if (image && image.image_url.includes('product-images')) {
        const filename = image.image_url.split('/').pop();
        if (filename) {
          await supabase.storage
            .from('product-images')
            .remove([filename]);
        }
      }

      toast({
        title: "Success",
        description: "Image deleted successfully"
      });

      loadImages();
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete image",
        variant: "destructive"
      });
    }
  };

  const setAsMain = async (imageId: string) => {
    try {
      // First, set all images as not main
      await supabase
        .from('product_images')
        .update({ is_main: false })
        .eq('product_id', productId);

      // Then set the selected image as main
      await supabase
        .from('product_images')
        .update({ is_main: true })
        .eq('id', imageId);

      toast({
        title: "Success",
        description: "Main image updated successfully"
      });

      loadImages();
    } catch (error: any) {
      console.error('Error setting main image:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to set main image",
        variant: "destructive"
      });
    }
  };

  const moveImage = async (imageId: string, direction: 'up' | 'down') => {
    const currentImage = images.find(img => img.id === imageId);
    if (!currentImage) return;

    const targetOrder = direction === 'up'
      ? currentImage.display_order - 1
      : currentImage.display_order + 1;

    const targetImage = images.find(img => img.display_order === targetOrder);
    if (!targetImage) return;

    try {
      // Swap display orders
      await Promise.all([
        supabase
          .from('product_images')
          .update({ display_order: targetOrder })
          .eq('id', imageId),
        supabase
          .from('product_images')
          .update({ display_order: currentImage.display_order })
          .eq('id', targetImage.id)
      ]);

      loadImages();
    } catch (error: any) {
      console.error('Error moving image:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to move image",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="bg-mtrix-black border-mtrix-gray">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Add New Images</h3>

          {/* File Upload */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload" className="text-sm font-medium text-foreground">
                Upload from Computer
              </Label>
              <div className="mt-2">
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-mtrix-black hover:file:bg-primary/80"
                  disabled={uploading}
                />
              </div>
            </div>

            {/* URL Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={newImage.image_url}
                  onChange={(e) => setNewImage(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="bg-mtrix-dark border-mtrix-gray"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alt_text">Alt Text</Label>
                <Input
                  id="alt_text"
                  value={newImage.alt_text}
                  onChange={(e) => setNewImage(prev => ({ ...prev, alt_text: e.target.value }))}
                  placeholder="Describe the image"
                  className="bg-mtrix-dark border-mtrix-gray"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="variant_value">Color Variant</Label>
                <Select
                  value={newImage.variant_value || "all"}
                  onValueChange={(value) => setNewImage(prev => ({
                    ...prev,
                    variant_type: value === "all" ? null : 'color',
                    variant_value: value === "all" ? null : value
                  }))}
                >
                  <SelectTrigger className="bg-mtrix-dark border-mtrix-gray">
                    <SelectValue placeholder="All Colors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Colors</SelectItem>
                    {availableColors.map(color => (
                      <SelectItem key={color} value={color}>{color}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_main"
                  checked={newImage.is_main}
                  onCheckedChange={(checked) => setNewImage(prev => ({ ...prev, is_main: checked }))}
                />
                <Label htmlFor="is_main">Set as main image</Label>
              </div>

              <Button
                onClick={addImageByUrl}
                className="bg-gradient-gold text-mtrix-black hover:shadow-gold"
                disabled={!newImage.image_url}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Image
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <Card key={image.id} className="bg-mtrix-black border-mtrix-gray">
            <CardContent className="p-4">
              <div className="relative bg-muted/20">
                <img
                  src={image.image_url}
                  alt={image.alt_text || 'Product image'}
                  className="w-full h-48 object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/api/placeholder/300/300';
                  }}
                />

                {image.is_main && (
                  <Badge className="absolute top-2 left-2 bg-green-500 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    Main
                  </Badge>
                )}

                {image.variant_type && image.variant_value && (
                  <Badge className="absolute top-2 right-2 bg-blue-500 text-white">
                    {image.variant_type}: {image.variant_value}
                  </Badge>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Alt Text</Label>
                  <Input
                    value={image.alt_text || ''}
                    onChange={(e) => updateImage(image.id, { alt_text: e.target.value })}
                    className="bg-mtrix-dark border-mtrix-gray text-xs"
                    placeholder="Image description"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {!image.is_main && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAsMain(image.id)}
                      className="text-xs"
                    >
                      <Star className="w-3 h-3 mr-1" />
                      Set Main
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveImage(image.id, 'up')}
                    disabled={index === 0}
                    className="text-xs"
                  >
                    <MoveUp className="w-3 h-3" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveImage(image.id, 'down')}
                    disabled={index === images.length - 1}
                    className="text-xs"
                  >
                    <MoveDown className="w-3 h-3" />
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteImage(image.id)}
                    className="text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {images.length === 0 && (
        <Card className="bg-mtrix-black border-mtrix-gray">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-mtrix-gray rounded-full flex items-center justify-center mx-auto mb-4">
                <Image className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Images</h3>
              <p className="text-muted-foreground">
                Add some images to showcase this product.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Cropper Dialog */}
      <ImageCropper
        image={imageToCrop}
        open={showCropper}
        onCropComplete={handleCroppedImage}
        onClose={() => {
          setShowCropper(false);
          setImageToCrop('');
          setCurrentFile(null);
        }}
      />
    </div>
  );
};

export default ProductImageManager;