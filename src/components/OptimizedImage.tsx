import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from "@/lib/utils";
import { getOptimizedImageUrl, imagePresets, isCloudinaryUrl } from '@/lib/cloudinary';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackClassName?: string;
    aspectRatio?: "square" | "video" | "portrait" | "landscape" | "auto";
    thumbnailSrc?: string; // Legacy prop for manual thumbnail URL
    preset?: keyof typeof imagePresets; // Cloudinary optimization preset
}

export const OptimizedImage = ({
    src,
    alt,
    className,
    fallbackClassName,
    loading = "lazy",
    decoding = "async",
    aspectRatio = "auto",
    width, // Optional width for resizing
    thumbnailSrc,
    preset,
    ...props
}: OptimizedImageProps & { width?: number }) => {
    const [error, setError] = useState(false);

    // Optimized URL Generator
    const getOptimizedUrl = (originalSrc: string, targetWidth?: number) => {
        if (!originalSrc) return '';

        // CLOUDINARY: Use automatic optimization if it's a Cloudinary URL
        if (isCloudinaryUrl(originalSrc)) {
            // Use preset if provided, otherwise generate based on width
            if (preset && imagePresets[preset]) {
                return getOptimizedImageUrl(originalSrc, imagePresets[preset]);
            }

            // Auto-select preset based on width
            if (targetWidth) {
                if (targetWidth <= 150) {
                    return getOptimizedImageUrl(originalSrc, imagePresets.galleryThumb);
                } else if (targetWidth <= 300) {
                    return getOptimizedImageUrl(originalSrc, imagePresets.thumbnail);
                } else if (targetWidth <= 500) {
                    return getOptimizedImageUrl(originalSrc, imagePresets.card);
                } else {
                    return getOptimizedImageUrl(originalSrc, { width: targetWidth, quality: 'auto', format: 'auto' });
                }
            }

            // Default: auto quality and format
            return getOptimizedImageUrl(originalSrc, { quality: 'auto', format: 'auto' });
        }

        // LEGACY: Manual Thumbnail Selection (for old Supabase images)
        // If a pre-generated thumbnail exists and the requested width is small,
        // use the thumbnail instead of the full image.
        if (thumbnailSrc && targetWidth && targetWidth <= 500) {
            return thumbnailSrc;
        }

        // SUPABASE FALLBACK: These transforms only work on Pro Plan
        // For free plan users, this still returns the original URL but with params
        // that won't work - the image will still load but won't be optimized
        if (originalSrc.includes('supabase.co/storage/v1/object/public') && targetWidth) {
            const separator = originalSrc.includes('?') ? '&' : '?';
            return `${originalSrc}${separator}width=${targetWidth}&resize=contain&format=webp&quality=80`;
        }

        return originalSrc;
    };

    const optimizedSrc = width ? getOptimizedUrl(src || '', width) : getOptimizedUrl(src || '', undefined);

    const aspectRatioClasses = {
        square: "aspect-square",
        video: "aspect-video",
        portrait: "aspect-[3/4]",
        landscape: "aspect-[4/3]",
        auto: "aspect-auto"
    };

    if (!src || error) {
        return (
            <div className={cn(
                "flex flex-col items-center justify-center bg-muted",
                aspectRatioClasses[aspectRatio],
                fallbackClassName || className
            )}>
                <ImageOff className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center px-4">
                    Unavailable
                </p>
            </div>
        );
    }

    return (
        <img
            src={optimizedSrc}
            alt={alt}
            className={cn(
                "object-cover w-full h-full",
                aspectRatioClasses[aspectRatio],
                className
            )}
            onError={() => setError(true)}
            loading={loading}
            decoding={decoding}
            {...props}
        />
    );
};
