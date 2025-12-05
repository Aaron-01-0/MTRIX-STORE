import React from 'react';
import { Truck, RotateCcw, ShieldCheck, Clock } from "lucide-react";

const ShippingReturns = () => {
    return (
        <div className="space-y-6 pt-2">
            <div className="grid gap-4">
                {/* Shipping */}
                <div className="flex gap-3">
                    <div className="mt-1">
                        <Truck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-white font-medium text-sm mb-1">Free Shipping</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            We offer free standard shipping on all orders above ₹999. Orders are typically processed within 24-48 hours.
                        </p>
                    </div>
                </div>

                {/* Delivery Time */}
                <div className="flex gap-3">
                    <div className="mt-1">
                        <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-white font-medium text-sm mb-1">Estimated Delivery</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Metro Cities: 3-5 business days<br />
                            Rest of India: 5-7 business days
                        </p>
                    </div>
                </div>

                {/* Returns */}
                <div className="flex gap-3">
                    <div className="mt-1">
                        <RotateCcw className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-white font-medium text-sm mb-1">Returns & Replacements</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Returns are only accepted for damaged or malfunctioning products. Please report within 48 hours of delivery with proof.
                        </p>
                    </div>
                </div>

                {/* Warranty */}
                <div className="flex gap-3">
                    <div className="mt-1">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-white font-medium text-sm mb-1">Quality Guarantee</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            All products go through a 3-step quality check before shipping. We ensure you get exactly what you ordered.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShippingReturns;
