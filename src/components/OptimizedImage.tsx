import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackClassName?: string;
    aspectRatio?: "square" | "video" | "portrait" | "landscape" | "auto";
}

export const OptimizedImage = ({
    src,
    alt,
    className,
    fallbackClassName,
    loading = "lazy",
    decoding = "async",
    aspectRatio = "auto",
    ...props
}: OptimizedImageProps) => {
    const [error, setError] = useState(false);

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
            src={src}
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

