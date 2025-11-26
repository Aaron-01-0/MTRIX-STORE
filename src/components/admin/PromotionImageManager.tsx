import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Link as LinkIcon } from 'lucide-react';
import { useStorageUpload } from '@/hooks/useStorageUpload';

interface PromotionImage {
  url: string;
  title?: string;
  description?: string;
  link?: string;
  alt?: string;
}

interface PromotionImageManagerProps {
  images: PromotionImage[];
  onChange: (images: PromotionImage[]) => void;
}

const PromotionImageManager = ({ images, onChange }: PromotionImageManagerProps) => {
  const { uploadFile, deleteFile, uploading } = useStorageUpload();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleUpload = async (file: File) => {
    const url = await uploadFile(file, {
      bucket: 'promotion-images',
      folder: 'banners',
      maxSizeMB: 5
    });

    if (url) {
      onChange([...images, { url, alt: file.name }]);
    }
  };

  const handleDelete = async (index: number) => {
    const image = images[index];
    const success = await deleteFile(image.url, 'promotion-images');
    
    if (success) {
      onChange(images.filter((_, i) => i !== index));
    }
  };

  const handleUpdate = (index: number, updates: Partial<PromotionImage>) => {
    const updated = [...images];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  return (
    <Card className="bg-mtrix-black border-mtrix-gray">
      <CardHeader>
        <CardTitle className="text-gradient-gold">Promotion Banners</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div>
          <Label htmlFor="promo-upload">Upload Promotion Banner</Label>
          <input
            id="promo-upload"
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-mtrix-black hover:file:bg-primary/80 mt-2"
            disabled={uploading}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Recommended size: 1200x400px. Max 5MB.
          </p>
        </div>

        {/* Images List */}
        <div className="space-y-4 mt-6">
          {images.map((image, index) => (
            <div key={index} className="border border-mtrix-gray rounded-lg p-4">
              <div className="flex gap-4">
                <img
                  src={image.url}
                  alt={image.alt || 'Promotion banner'}
                  className="w-48 h-32 object-cover rounded"
                />
                
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Banner title"
                    value={image.title || ''}
                    onChange={(e) => handleUpdate(index, { title: e.target.value })}
                    className="bg-mtrix-dark border-mtrix-gray"
                  />
                  <Textarea
                    placeholder="Description"
                    value={image.description || ''}
                    onChange={(e) => handleUpdate(index, { description: e.target.value })}
                    className="bg-mtrix-dark border-mtrix-gray"
                    rows={2}
                  />
                  <Input
                    placeholder="Link URL (optional)"
                    value={image.link || ''}
                    onChange={(e) => handleUpdate(index, { link: e.target.value })}
                    className="bg-mtrix-dark border-mtrix-gray"
                  />
                  <Input
                    placeholder="Alt text"
                    value={image.alt || ''}
                    onChange={(e) => handleUpdate(index, { alt: e.target.value })}
                    className="bg-mtrix-dark border-mtrix-gray"
                  />
                </div>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {images.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <LinkIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No promotion banners yet. Upload your first one!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PromotionImageManager;
