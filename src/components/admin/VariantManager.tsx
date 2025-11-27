import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Loader2, ChevronDown, ChevronRight, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type ProductVariant = Tables<'product_variants'>;

interface VariantManagerProps {
    productId: string;
    productName: string;
    basePrice: number;
}

interface ColorGroup {
    color: string;
    isOpen: boolean;
    variants: ProductVariant[];
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const VariantManager = ({ productId, productName, basePrice }: VariantManagerProps) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [colorGroups, setColorGroups] = useState<ColorGroup[]>([]);
    const [newColor, setNewColor] = useState('');

    useEffect(() => {
        loadVariants();
    }, [productId]);

    const loadVariants = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('product_variants')
                .select('*')
                .eq('product_id', productId)
                .order('color', { ascending: true })
                .order('size', { ascending: true });

            if (error) throw error;

            const vars = data || [];
            setVariants(vars);
            groupVariantsByColor(vars);
        } catch (error) {
            console.error('Error loading variants:', error);
            toast({ title: "Error", description: "Failed to load variants", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const groupVariantsByColor = (vars: ProductVariant[]) => {
        const groups: { [key: string]: ProductVariant[] } = {};
        vars.forEach(v => {
            if (!groups[v.color]) groups[v.color] = [];
            groups[v.color].push(v);
        });

        const newGroups = Object.keys(groups).map(color => ({
            color,
            isOpen: true, // Default open
            variants: groups[color]
        }));
        setColorGroups(newGroups);
    };

    const addColorGroup = async () => {
        if (!newColor.trim()) return;

        // Check if color already exists
        if (colorGroups.some(g => g.color.toLowerCase() === newColor.toLowerCase())) {
            toast({ title: "Error", description: "Color already exists", variant: "destructive" });
            return;
        }

        // Add empty group locally
        setColorGroups([...colorGroups, { color: newColor, isOpen: true, variants: [] }]);
        setNewColor('');
    };

    const addVariant = async (color: string, size: string) => {
        try {
            // Check if exists
            const exists = variants.some(v => v.color === color && v.size === size);
            if (exists) return;

            const newVariant = {
                product_id: productId,
                color: color,
                size: size,
                sku: `${productName.substring(0, 6).toUpperCase()}-${color.substring(0, 3).toUpperCase()}-${size}`,
                stock_quantity: 0,
                price: null, // Use base price
                is_active: true
            };

            const { data, error } = await supabase
                .from('product_variants')
                .insert([newVariant])
                .select()
                .single();

            if (error) throw error;

            const updatedVariants = [...variants, data];
            setVariants(updatedVariants);
            groupVariantsByColor(updatedVariants);
            toast({ title: "Success", description: `Added ${size} variant` });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const updateVariant = async (id: string, updates: Partial<ProductVariant>) => {
        try {
            const { error } = await supabase
                .from('product_variants')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            const updatedVariants = variants.map(v => v.id === id ? { ...v, ...updates } : v);
            setVariants(updatedVariants);
            groupVariantsByColor(updatedVariants);
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to update", variant: "destructive" });
        }
    };

    const deleteVariant = async (id: string) => {
        try {
            const { error } = await supabase.from('product_variants').delete().eq('id', id);
            if (error) throw error;

            const updatedVariants = variants.filter(v => v.id !== id);
            setVariants(updatedVariants);
            groupVariantsByColor(updatedVariants);
            toast({ title: "Success", description: "Variant deleted" });
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
        }
    };

    const deleteColorGroup = async (color: string) => {
        if (!confirm(`Delete all ${color} variants?`)) return;

        try {
            const { error } = await supabase
                .from('product_variants')
                .delete()
                .eq('product_id', productId)
                .eq('color', color);

            if (error) throw error;

            const updatedVariants = variants.filter(v => v.color !== color);
            setVariants(updatedVariants);
            groupVariantsByColor(updatedVariants);
            toast({ title: "Success", description: `Deleted ${color} group` });
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to delete group", variant: "destructive" });
        }
    };

    if (loading) return <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-end gap-4">
                <div className="space-y-2 flex-1">
                    <Label>Add Color Variant</Label>
                    <Input
                        placeholder="e.g. Midnight Black"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addColorGroup()}
                        className="bg-black/20 border-white/10"
                    />
                </div>
                <Button onClick={addColorGroup} disabled={!newColor} className="bg-primary text-black hover:bg-white">
                    <Plus className="w-4 h-4 mr-2" /> Add Color
                </Button>
            </div>

            <div className="space-y-4">
                {colorGroups.map((group) => (
                    <Collapsible
                        key={group.color}
                        open={group.isOpen}
                        onOpenChange={(open) => {
                            const newGroups = colorGroups.map(g => g.color === group.color ? { ...g, isOpen: open } : g);
                            setColorGroups(newGroups);
                        }}
                        className="border border-white/10 rounded-lg bg-black/20"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="p-0 w-6 h-6 hover:bg-white/10">
                                        {group.isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </Button>
                                </CollapsibleTrigger>
                                <h3 className="font-semibold text-lg">{group.color}</h3>
                                <Badge variant="outline" className="ml-2">{group.variants.length} Sizes</Badge>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => deleteColorGroup(group.color)} className="text-red-500 hover:text-red-400 hover:bg-red-500/10">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                        <CollapsibleContent className="p-4 space-y-4">
                            {/* Quick Add Sizes */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {SIZES.map(size => {
                                    const exists = group.variants.some(v => v.size === size);
                                    return (
                                        <Button
                                            key={size}
                                            variant="outline"
                                            size="sm"
                                            disabled={exists}
                                            onClick={() => addVariant(group.color, size)}
                                            className={cn("border-white/10 hover:bg-primary/20", exists && "opacity-50 cursor-not-allowed")}
                                        >
                                            + {size}
                                        </Button>
                                    );
                                })}
                            </div>

                            {/* Variants Table */}
                            {group.variants.length > 0 && (
                                <div className="rounded-md border border-white/10 overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-white/5">
                                            <tr>
                                                <th className="p-3 text-left font-medium">Size</th>
                                                <th className="p-3 text-left font-medium">SKU</th>
                                                <th className="p-3 text-left font-medium">Stock</th>
                                                <th className="p-3 text-left font-medium">Price Override</th>
                                                <th className="p-3 text-right font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            {group.variants.map(variant => (
                                                <tr key={variant.id} className="group hover:bg-white/5">
                                                    <td className="p-3 font-medium">{variant.size}</td>
                                                    <td className="p-3">
                                                        <Input
                                                            value={variant.sku || ''}
                                                            onChange={(e) => updateVariant(variant.id, { sku: e.target.value })}
                                                            className="h-8 w-40 bg-black/20 border-white/10"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <Input
                                                            type="number"
                                                            value={variant.stock_quantity}
                                                            onChange={(e) => updateVariant(variant.id, { stock_quantity: parseInt(e.target.value) || 0 })}
                                                            className={cn("h-8 w-24 bg-black/20 border-white/10", variant.stock_quantity === 0 && "text-red-500 border-red-500/50")}
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <Input
                                                            type="number"
                                                            placeholder={basePrice.toString()}
                                                            value={variant.price || ''}
                                                            onChange={(e) => updateVariant(variant.id, { price: e.target.value ? parseFloat(e.target.value) : null })}
                                                            className="h-8 w-24 bg-black/20 border-white/10"
                                                        />
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => deleteVariant(variant.id)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CollapsibleContent>
                    </Collapsible>
                ))}

                {colorGroups.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-lg">
                        <p className="text-muted-foreground">No variants yet. Add a color to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VariantManager;
