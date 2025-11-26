import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackClassName?: string;
}

export const OptimizedImage = ({
    src,
    alt,
    className,
    fallbackClassName,
    loading = "lazy",
    decoding = "async",
    ...props
}: OptimizedImageProps) => {
    const [error, setError] = useState(false);

    if (!src || error) {
        return (
            <div className={`flex flex-col items-center justify-center bg-muted ${fallbackClassName || className}`}>
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
            className={className}
            onError={() => setError(true)}
            loading={loading}
            decoding={decoding}
            {...props}
        />
    );
};
