import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export const ImageWithFallback = ({ src, alt, className, fallbackClassName }: ImageWithFallbackProps) => {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted ${fallbackClassName || className}`}>
        <ImageOff className="w-12 h-12 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground text-center px-4">
          We're sorry, this image is currently unavailable
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
    />
  );
};
