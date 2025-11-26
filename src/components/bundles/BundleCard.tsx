import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Package, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BundleImageCollage from './BundleImageCollage';

interface BundleCardProps {
    bundle: {
        id: string;
        name: string;
        description: string | null;
        image_url: string | null;
        bundle_price: number;
        items?: {
            quantity: number;
            product: {
                name: string;
                base_price: number;
                image_url?: string;
            };
        }[];
    };
}

const BundleCard = ({ bundle }: BundleCardProps) => {
    const navigate = useNavigate();

    // Calculate total value and savings
    const totalValue = bundle.items?.reduce((acc, item) => {
        return acc + (item.product.base_price || 0) * item.quantity;
    }, 0) || 0;

    const savings = totalValue > bundle.bundle_price ? totalValue - bundle.bundle_price : 0;
    const savingsPercentage = totalValue > 0 ? Math.round((savings / totalValue) * 100) : 0;

    // Get product images for collage
    const productImages = bundle.items?.map(item => item.product.image_url || '').filter(Boolean) || [];

    // Use bundle image if no product images, or if explicitly set as main (logic can be adjusted)
    // For now, if we have product images, we show the collage. If not, we fall back to bundle image.
    const showCollage = productImages.length > 0;

    return (
        <Card
            className="group relative bg-mtrix-dark border-mtrix-gray overflow-hidden transition-all duration-500 hover:border-primary/50 hover:shadow-[0_0_30px_-5px_rgba(var(--primary-rgb),0.2)] cursor-pointer h-full flex flex-col"
            onClick={() => navigate(`/bundle/${bundle.id}`)}
        >
            {/* Image Section */}
            <div className="relative h-64 overflow-hidden bg-mtrix-black">
                {showCollage ? (
                    <BundleImageCollage images={productImages} name={bundle.name} />
                ) : (
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                        style={{ backgroundImage: `url(${bundle.image_url || '/placeholder.png'})` }}
                    />
                )}

                {/* Gradient Overlay for text readability if needed, though collage might not need it as much */}
                <div className="absolute inset-0 bg-gradient-to-t from-mtrix-dark via-transparent to-transparent opacity-60 pointer-events-none" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                    <Badge className="bg-primary text-black font-bold font-orbitron flex items-center gap-1 shadow-lg">
                        <Package className="w-3 h-3" />
                        BUNDLE
                    </Badge>
                    {savings > 0 && (
                        <Badge className="bg-green-500 text-white font-bold font-orbitron flex items-center gap-1 shadow-lg">
                            <Sparkles className="w-3 h-3" />
                            SAVE {savingsPercentage}%
                        </Badge>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <CardContent className="p-6 flex-1 flex flex-col relative z-10">
                <div className="mb-4">
                    <h3 className="text-xl font-orbitron font-bold text-white group-hover:text-primary transition-colors mb-2">
                        {bundle.name}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                        {bundle.description || 'Carefully curated items packed together for great value.'}
                    </p>
                </div>

                {/* Included Items Preview */}
                {bundle.items && bundle.items.length > 0 && (
                    <div className="mb-6 space-y-2 bg-black/40 p-3 rounded-lg border border-white/5 backdrop-blur-sm">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Includes:</p>
                        <div className="space-y-1">
                            {bundle.items.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                                    <span className="text-primary font-bold">{item.quantity}x</span>
                                    <span className="truncate">{item.product.name}</span>
                                </div>
                            ))}
                            {bundle.items.length > 3 && (
                                <p className="text-xs text-muted-foreground pl-6">+ {bundle.items.length - 3} more items</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                        {savings > 0 && (
                            <p className="text-sm text-muted-foreground line-through">₹{totalValue}</p>
                        )}
                        <p className="text-2xl font-bold text-primary">₹{bundle.bundle_price}</p>
                    </div>
                    <Button
                        size="sm"
                        className="bg-white text-black hover:bg-primary hover:text-black font-bold transition-all duration-300 group-hover:translate-x-1"
                    >
                        View Deal
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default BundleCard;
