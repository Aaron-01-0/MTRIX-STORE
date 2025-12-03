import React from 'react';
import { cn } from "@/lib/utils";
import { ShoppingBag, Weight, Lock } from "lucide-react";

interface ToteBagDetailsProps {
    className?: string;
}

const ToteBagDetails: React.FC<ToteBagDetailsProps> = ({ className }) => {
    const details = [
        {
            question: "What Is The Material Of Tote Bags?",
            answer: "Our Tote Bags are made with 100% Cotton Woven Canvas Fabrics of minimum 200 GSM.",
            icon: ShoppingBag,
            color: "text-orange-400"
        },
        {
            question: "How Much Weight Does The Tote Bag Can Carry?",
            answer: "A printed canvas tote bag can carry up to 10 KGs of weight. It's the perfect weight for local shopping, groceries, and cosmetics.",
            icon: Weight,
            color: "text-orange-400"
        },
        {
            question: "Is Zipper In The Tote Bags Last Long Enough For Daily Usage?",
            answer: "We are using premium zippers for our products like both White and Black tote bags. It works fine even after several uses without any lags.",
            icon: Lock,
            color: "text-orange-400"
        }
    ];

    return (
        <div className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700", className)}>
            <div className="space-y-4">
                {details.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                        <div className="flex items-start gap-3">
                            <div className={cn("mt-1 p-2 rounded-lg bg-black/40 border border-white/10", item.color)}>
                                <item.icon className="w-4 h-4" />
                            </div>
                            <div className="space-y-2">
                                <h4 className={cn("font-bold text-base", item.color)}>
                                    {item.question}
                                </h4>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    {item.answer}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ToteBagDetails;
