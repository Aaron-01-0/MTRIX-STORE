/**
 * Cloudinary Integration for MTRIX
 * Handles image uploads and URL optimization
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dptsqmgpi';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'mtrix_unsigned';

// Map Supabase bucket names to Cloudinary folders
const BUCKET_TO_FOLDER: Record<string, string> = {
    'product-images': 'products',
    'hero-images': 'hero',
    'category-images': 'categories',
    'promotion-images': 'promotions',
    'product-videos': 'videos',
    'design-submissions': 'arena',
    'community-content': 'community',
    'invoices': 'invoices'
};

interface UploadOptions {
    folder?: string;
    bucket?: string; // For backward compatibility with existing code
    resourceType?: 'image' | 'video' | 'auto';
}

interface OptimizeOptions {
    width?: number;
    height?: number;
    quality?: 'auto' | 'auto:low' | 'auto:good' | 'auto:best' | number;
    format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
    crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'limit';
}

/**
 * Upload a file to Cloudinary
 * @param file - The file to upload
 * @param options - Upload options (folder or bucket name)
 * @returns The secure URL of the uploaded file, or null on failure
 */
export async function uploadToCloudinary(
    file: File,
    options: UploadOptions = {}
): Promise<string | null> {
    const { folder, bucket, resourceType = 'auto' } = options;

    // Determine the folder: use explicit folder, or map from bucket name
    const targetFolder = folder || (bucket ? BUCKET_TO_FOLDER[bucket] : 'uploads');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', `mtrix/${targetFolder}`);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
            { method: 'POST', body: formData }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Cloudinary upload failed:', errorData);
            throw new Error(errorData.error?.message || 'Upload failed');
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return null;
    }
}

/**
 * Generate an optimized Cloudinary URL with transformations
 * Falls back to original URL for non-Cloudinary images (backward compatibility)
 */
export function getOptimizedImageUrl(
    url: string | null | undefined,
    options: OptimizeOptions = {}
): string {
    // Handle null/undefined URLs
    if (!url) return '';

    // If not a Cloudinary URL, return as-is (for legacy Supabase images)
    if (!url.includes('cloudinary.com') && !url.includes('res.cloudinary.com')) {
        return url;
    }

    const {
        width,
        height,
        quality = 'auto',
        format = 'auto',
        crop = 'fill'
    } = options;

    const transforms: string[] = [];

    // Add dimension transforms
    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    if (width || height) transforms.push(`c_${crop}`);

    // Always add quality and format for optimization
    transforms.push(`q_${quality}`);
    transforms.push(`f_${format}`);

    // If no transforms, return original
    if (transforms.length === 0) return url;

    const transformString = transforms.join(',');

    // Insert transforms after /upload/ in the URL
    // Handle both /upload/ and /upload/v1234567890/ patterns
    return url.replace(
        /\/upload\/(v\d+\/)?/,
        `/upload/${transformString}/$1`
    );
}

/**
 * Preset optimizations for common use cases
 * Use these with getOptimizedImageUrl for consistent sizing
 */
export const imagePresets = {
    // Small thumbnails for grids and lists
    thumbnail: { width: 300, height: 300, quality: 'auto' as const, crop: 'fill' as const },

    // Product cards in catalog
    card: { width: 400, height: 400, quality: 'auto' as const, crop: 'fill' as const },

    // Product detail page images
    product: { width: 800, height: 800, quality: 'auto:good' as const, crop: 'fit' as const },

    // Full-width hero banners
    hero: { width: 1920, height: 800, quality: 'auto:best' as const, crop: 'fill' as const },

    // Category thumbnails
    category: { width: 600, height: 400, quality: 'auto' as const, crop: 'fill' as const },

    // User avatars
    avatar: { width: 100, height: 100, quality: 'auto' as const, crop: 'thumb' as const },

    // Gallery thumbnails
    galleryThumb: { width: 150, height: 150, quality: 'auto' as const, crop: 'fill' as const },

    // Open Graph / Social sharing
    og: { width: 1200, height: 630, quality: 'auto:good' as const, crop: 'fill' as const }
};

/**
 * Check if a URL is from Cloudinary
 */
export function isCloudinaryUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
}

/**
 * Delete a file from Cloudinary (requires server-side implementation)
 * For now, this is a placeholder - deletion should be handled via Edge Function
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
    console.warn('Cloudinary deletion requires server-side implementation');
    // TODO: Implement via Supabase Edge Function with Cloudinary Admin API
    return false;
}
