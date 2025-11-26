import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadOptions {
  bucket: 'hero-images' | 'promotion-images' | 'category-images' | 'product-images' | 'product-videos' | 'design-submissions';
  folder?: string;
  maxSizeMB?: number;
}

export const useStorageUpload = () => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (
    file: File,
    options: UploadOptions
  ): Promise<string | null> => {
    const { bucket, folder = '', maxSizeMB = bucket === 'hero-images' ? 20 : 5 } = options;

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: `File size exceeds ${maxSizeMB}MB limit`,
        variant: "destructive"
      });
      return null;
    }

    setUploading(true);

    try {
      // Generate automatic filename: folder_timestamp_randomId.extension
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const extension = file.name.split('.').pop();
      const sanitizedName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      
      const filename = folder
        ? `${folder}/${sanitizedName}_${timestamp}_${randomId}.${extension}`
        : `${sanitizedName}_${timestamp}_${randomId}.${extension}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filename);

      toast({
        title: "Success",
        description: "File uploaded successfully"
      });

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (
    url: string,
    bucket: UploadOptions['bucket']
  ): Promise<boolean> => {
    try {
      // Extract filename from URL
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === bucket);
      
      if (bucketIndex === -1 || bucketIndex === urlParts.length - 1) {
        console.error('Could not extract filename from URL');
        return false;
      }

      const filename = urlParts.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filename]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "File deleted successfully"
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete file",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    uploadFile,
    deleteFile,
    uploading
  };
};
