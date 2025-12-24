import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface AttributeValue {
    id: string;
    value: string;
    display_order: number;
}

export interface ProductAttribute {
    id: string;
    name: string;
    display_name: string;
    display_order: number;
    attribute_values: AttributeValue[];
}

export interface ProductVariant {
    id: string;
    attribute_json: Record<string, string> | null;
    stock_quantity: number;
    is_active: boolean;
    // Legacy support
    color?: string | null;
    size?: string;
}

interface VariantSelectorProps {
    attributes: ProductAttribute[];
    variants: ProductVariant[];
    selections: Record<string, string>;
    onSelectionChange: (attributeName: string, value: string) => void;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
    attributes,
    variants,
    selections,
    onSelectionChange,
}) => {
    // Helper to check if a specific combination is available
    const isValueAvailable = (attributeName: string, value: string) => {
        // If this is the first selection, everything is "available" if it exists in at least one active variant
        const otherSelections = { ...selections };
        delete otherSelections[attributeName]; // Ignore current attribute's old value

        // Find any variant that matches:
        // 1. The potential new value for ANY attribute key matching attributeName
        // 2. All OTHER current selections
        return variants.some((variant) => {
            if (!variant.is_active || variant.stock_quantity <= 0) return false;

            const attrs = variant.attribute_json || {};

            // Match the proposed value
            if (attrs[attributeName] !== value) {
                // Fallback for legacy color/size columns if JSON is missing
                if (attributeName === 'Color' && variant.color !== value) return false;
                if (attributeName === 'Size' && variant.size !== value) return false;
                if (attributeName !== 'Color' && attributeName !== 'Size' && attrs[attributeName] !== value) return false;
            }

            // Match other already selected attributes
            return Object.entries(otherSelections).every(([key, val]) => {
                if (attrs[key] === val) return true;
                // Fallback legacy
                if (key === 'Color' && variant.color === val) return true;
                if (key === 'Size' && variant.size === val) return true;
                return false;
            });
        });
    };

    if (attributes.length === 0) return null;

    return (
        <div className="space-y-6">
            {attributes.map((attr) => (
                <div key={attr.id} className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">
                            {attr.display_name || attr.name}:
                            <span className="text-white ml-1">{selections[attr.name]}</span>
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {attr.attribute_values
                            .sort((a, b) => a.display_order - b.display_order)
                            .map((val) => {
                                const isSelected = selections[attr.name] === val.value;
                                const isAvailable = isValueAvailable(attr.name, val.value);
                                const isColor = attr.name.toLowerCase() === 'color';

                                if (isColor) {
                                    return (
                                        <button
                                            key={val.id}
                                            onClick={() => onSelectionChange(attr.name, val.value)}
                                            disabled={!isAvailable && !isSelected} // Allow deselection or keeping selected even if OOS? Actually better to disable only if not selected.
                                            className={cn(
                                                "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all relative",
                                                isSelected ? "border-primary scale-110" : "border-transparent hover:scale-105",
                                                !isAvailable && !isSelected && "opacity-50 cursor-not-allowed saturate-0"
                                            )}
                                            style={{ backgroundColor: val.value.toLowerCase() }}
                                            title={val.value}
                                        >
                                            {isSelected && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}
                                            {!isAvailable && !isSelected && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-full h-0.5 bg-red-500/50 rotate-45" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                }

                                return (
                                    <button
                                        key={val.id}
                                        onClick={() => onSelectionChange(attr.name, val.value)}
                                        disabled={!isAvailable && !isSelected}
                                        className={cn(
                                            "px-4 py-2 rounded-lg border text-sm font-medium transition-all min-w-[3rem]",
                                            isSelected
                                                ? "border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(255,215,0,0.1)]"
                                                : (!isAvailable && !isSelected)
                                                    ? "border-white/5 bg-white/5 text-muted-foreground/50 cursor-not-allowed decoration-slice line-through"
                                                    : "border-white/10 bg-black/20 text-muted-foreground hover:border-white/30 hover:text-white"
                                        )}
                                    >
                                        {val.value}
                                    </button>
                                );
                            })}
                    </div>
                </div>
            ))}
        </div>
    );
};
