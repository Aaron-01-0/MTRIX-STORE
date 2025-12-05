import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Star, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CatalogFiltersProps {
    categories: { id: string; name: string; count: number; parent_id?: string | null }[];
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    priceRange: [number, number];
    setPriceRange: (range: [number, number]) => void;
    minRating: number;
    setMinRating: (rating: number) => void;
    stockFilter: 'all' | 'in_stock' | 'out_of_stock';
    setStockFilter: (filter: 'all' | 'in_stock' | 'out_of_stock') => void;
    clearFilters: () => void;
}

const CatalogFilters = ({
    categories,
    selectedCategory,
    setSelectedCategory,
    priceRange,
    setPriceRange,
    minRating,
    setMinRating,
    stockFilter,
    setStockFilter,
    clearFilters
}: CatalogFiltersProps) => {
    return (
        <div className="space-y-8">
            {/* Categories */}
            <div className="space-y-4">
                <Label className="text-lg font-orbitron font-bold text-white flex items-center gap-2">
                    Categories
                </Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white max-h-[300px]">
                        {/* Helper function to build hierarchy */}
                        {(() => {
                            const buildHierarchy = (parentId: string | null = null, depth = 0): JSX.Element[] => {
                                return categories
                                    .filter(cat => cat.id !== 'all' && (cat.parent_id === parentId || (parentId === null && !cat.parent_id)))
                                    .map(cat => (
                                        <div key={cat.id}>
                                            <SelectItem
                                                value={cat.id}
                                                className="cursor-pointer focus:bg-white/10 focus:text-white"
                                                style={{ paddingLeft: `${(depth * 16) + 8}px` }}
                                            >
                                                <div className="flex items-center justify-between w-full gap-2">
                                                    <span>{cat.name}</span>
                                                    <span className="text-xs text-muted-foreground bg-white/10 px-1.5 rounded-full">
                                                        {cat.count}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                            {buildHierarchy(cat.id, depth + 1)}
                                        </div>
                                    ));
                            };

                            return (
                                <>
                                    <SelectItem value="all" className="cursor-pointer focus:bg-white/10 focus:text-white font-bold border-b border-white/10 mb-1">
                                        <div className="flex items-center justify-between w-full gap-2">
                                            <span>All Categories</span>
                                            <span className="text-xs text-muted-foreground bg-white/10 px-1.5 rounded-full">
                                                {categories.find(c => c.id === 'all')?.count || 0}
                                            </span>
                                        </div>
                                    </SelectItem>
                                    {buildHierarchy(null, 0)}
                                </>
                            );
                        })()}
                    </SelectContent>
                </Select>
            </div>

            <Separator className="bg-white/10" />

            {/* Price Range */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-lg font-orbitron font-bold text-white">Price Range</Label>
                    <span className="text-xs text-muted-foreground">₹{priceRange[0]} - ₹{priceRange[1]}</span>
                </div>
                <div className="px-2">
                    <Slider
                        min={0}
                        max={10000}
                        step={100}
                        value={priceRange}
                        onValueChange={(value) => setPriceRange(value as [number, number])}
                        className="py-4 [&>.relative>.absolute]:shadow-[0_0_10px_rgba(255,215,0,0.5)]"
                    />
                    <div className="flex justify-between items-center mt-2">
                        <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-md text-xs font-mono text-white">
                            ₹{priceRange[0]}
                        </div>
                        <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-md text-xs font-mono text-white">
                            ₹{priceRange[1]}
                        </div>
                    </div>
                </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Rating */}
            <div className="space-y-2">
                <Label className="text-lg font-orbitron font-bold text-white">Rating</Label>
                <div className="space-y-2">
                    {[4, 3, 2, 1].map((rating) => (
                        <button
                            key={rating}
                            onClick={() => setMinRating(rating === minRating ? 0 : rating)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all border",
                                minRating === rating
                                    ? "bg-white/5 border-primary/50 text-white shadow-[inset_0_0_10px_rgba(255,215,0,0.1)]"
                                    : "border-transparent text-muted-foreground hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={cn(
                                            "w-4 h-4 transition-colors",
                                            i < rating ? "fill-primary text-primary" : "text-white/10 fill-white/5"
                                        )}
                                    />
                                ))}
                            </div>
                            <span className="text-xs font-medium pt-0.5">& Up</span>
                        </button>
                    ))}
                </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Availability */}
            <div className="space-y-2">
                <Label className="text-lg font-orbitron font-bold text-white">Availability</Label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setStockFilter('in_stock')}
                        className={cn(
                            "px-3 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2",
                            stockFilter === 'in_stock'
                                ? "border-mtrix-gold bg-mtrix-gold/10 text-mtrix-gold shadow-[0_0_10px_rgba(255,215,0,0.1)]"
                                : "border-white/10 bg-white/5 text-muted-foreground hover:border-green-500/30 hover:text-green-400"
                        )}
                    >
                        {stockFilter === 'in_stock' && <Check className="w-3 h-3" />}
                        In Stock
                    </button>
                    <button
                        onClick={() => setStockFilter('out_of_stock')}
                        className={cn(
                            "px-3 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2",
                            stockFilter === 'out_of_stock'
                                ? "border-mtrix-gold bg-mtrix-gold/10 text-mtrix-gold shadow-[0_0_10px_rgba(255,215,0,0.1)]"
                                : "border-white/10 bg-white/5 text-muted-foreground hover:border-red-500/30 hover:text-red-400"
                        )}
                    >
                        {stockFilter === 'out_of_stock' && <Check className="w-3 h-3" />}
                        Out of Stock
                    </button>
                </div>
            </div>

            {/* Clear Filters */}
            <Button
                variant="outline"
                className="w-full border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 hover:text-primary transition-all h-10 mt-4"
                onClick={clearFilters}
            >
                <X className="w-4 h-4 mr-2" />
                Reset Filters
            </Button>
        </div>
    );
};

export default CatalogFilters;
