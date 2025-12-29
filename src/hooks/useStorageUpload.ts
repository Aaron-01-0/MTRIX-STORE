import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { uploadToCloudinary, isCloudinaryUrl } from '@/lib/cloudinary';

interface UploadOptions {
  bucket: 'hero-images' | 'promotion-images' | 'category-images' | 'product-images' | 'product-videos' | 'design-submissions' | 'community-content';
  folder?: string;
  maxSizeMB?: number;
  useCloudinary?: boolean; // Option to force Supabase for specific cases
}

export const useStorageUpload = () => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (
    file: File,
    options: UploadOptions
  ): Promise<string | null> => {
    const {
      bucket,
      folder = '',
      maxSizeMB = bucket === 'hero-images' ? 20 : 10,
      useCloudinary: forceCloudinary = true // Default to Cloudinary
    } = options;

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
      // Use Cloudinary for image uploads (solves egress limits)
      if (forceCloudinary && !file.type.startsWith('video/')) {
        const cloudinaryUrl = await uploadToCloudinary(file, { bucket });

        if (!cloudinaryUrl) {
          throw new Error('Cloudinary upload failed');
        }

        toast({
          title: "Success",
          description: "Image uploaded successfully"
        });

        return cloudinaryUrl;
      }

      // Fallback to Supabase for videos or when explicitly requested
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

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filename, file, {
          cacheControl: '31536000',
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
      // Handle Cloudinary URLs - for now, just log (deletion requires server-side)
      if (isCloudinaryUrl(url)) {
        console.log('Cloudinary file deletion skipped (requires server-side API)');
        // Files remain in Cloudinary but are no longer referenced
        // This is acceptable as Cloudinary has good storage limits
        toast({
          title: "Success",
          description: "File reference removed"
        });
        return true;
      }

      // Handle Supabase URLs
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
