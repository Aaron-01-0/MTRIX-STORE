import { ImageWithFallback } from '@/components/ImageWithFallback';

interface BundleImageCollageProps {
    images: string[];
    name: string;
}

const BundleImageCollage = ({ images, name }: BundleImageCollageProps) => {
    const validImages = images.filter(Boolean).slice(0, 4);
    const count = validImages.length;

    if (count === 0) {
        return (
            <div className="w-full h-full bg-mtrix-dark flex items-center justify-center">
                <span className="text-muted-foreground text-sm">No images</span>
            </div>
        );
    }

    if (count === 1) {
        return (
            <ImageWithFallback
                src={validImages[0]}
                alt={name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                fallbackClassName="w-full h-full bg-mtrix-dark"
            />
        );
    }

    if (count === 2) {
        return (
            <div className="w-full h-full grid grid-cols-2 gap-0.5">
                {validImages.map((img, i) => (
                    <div key={i} className="relative overflow-hidden">
                        <ImageWithFallback
                            src={img}
                            alt={`${name} ${i + 1}`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            fallbackClassName="w-full h-full bg-mtrix-dark"
                        />
                    </div>
                ))}
            </div>
        );
    }

    if (count === 3) {
        return (
            <div className="w-full h-full grid grid-cols-2 gap-0.5">
                <div className="relative overflow-hidden">
                    <ImageWithFallback
                        src={validImages[0]}
                        alt={`${name} 1`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        fallbackClassName="w-full h-full bg-mtrix-dark"
                    />
                </div>
                <div className="grid grid-rows-2 gap-0.5">
                    {validImages.slice(1).map((img, i) => (
                        <div key={i} className="relative overflow-hidden">
                            <ImageWithFallback
                                src={img}
                                alt={`${name} ${i + 2}`}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                fallbackClassName="w-full h-full bg-mtrix-dark"
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 4 or more images
    return (
        <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5">
            {validImages.map((img, i) => (
                <div key={i} className="relative overflow-hidden">
                    <ImageWithFallback
                        src={img}
                        alt={`${name} ${i + 1}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        fallbackClassName="w-full h-full bg-mtrix-dark"
                    />
                </div>
            ))}
        </div>
    );
};

export default BundleImageCollage;
