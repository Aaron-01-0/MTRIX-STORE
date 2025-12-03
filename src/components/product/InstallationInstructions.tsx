import React from 'react';
import { cn } from "@/lib/utils";
import { StickyNote, Hammer, Magnet, Wrench, LucideIcon } from "lucide-react";

interface InstallationInstructionsProps {
    categoryName?: string;
    variantName?: string;
    className?: string;
}

interface InstructionContent {
    title: string;
    description: string;
    steps: string[];
    icon: LucideIcon;
    color: string;
    bgColor: string;
    borderColor: string;
}

const InstallationInstructions: React.FC<InstallationInstructionsProps> = ({
    categoryName = "",
    variantName = "",
    className
}) => {

    const getContent = (): InstructionContent => {
        const category = categoryName?.toLowerCase() || "";
        const variant = variantName?.toLowerCase() || "";

        // Metal Posters
        if (category.includes("metal") || variant.includes("metal")) {
            return {
                title: "Magnet Mounting System",
                description: "Install your metal poster in seconds with our tool-free magnet system. No wall damage, easy to swap.",
                steps: [
                    "Clean the wall surface with the provided wipe.",
                    "Peel the protective backing off the magnet sticker.",
                    "Press the magnet firmly against the wall for 10 seconds.",
                    "Place your metal poster onto the magnet. Done!"
                ],
                icon: Magnet,
                color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
                bgColor: "bg-blue-950/10",
                borderColor: "border-blue-500/20"
            };
        }

        // Acrylic Posters
        if (category.includes("acrylic") || variant.includes("acrylic")) {
            return {
                title: "Standoff Mounting Kit",
                description: "Premium floating look with our stainless steel standoff kit. Requires drilling for a secure fit.",
                steps: [
                    "Mark the 4 hole positions using the poster as a template.",
                    "Drill holes and insert the wall anchors.",
                    "Screw the standoff barrels into the wall.",
                    "Align poster and screw on the caps to secure it."
                ],
                icon: Wrench,
                color: "text-purple-400 bg-purple-400/10 border-purple-400/20",
                bgColor: "bg-purple-950/10",
                borderColor: "border-purple-500/20"
            };
        }

        // Framed Posters
        if (category.includes("frame") || variant.includes("frame")) {
            return {
                title: "Hanging Hardware Included",
                description: "Ready to hang right out of the box. Includes sawtooth hanger or hanging wire depending on size.",
                steps: [
                    "Measure and mark the desired height on your wall.",
                    "Install a nail or picture hook (not included) at the mark.",
                    "Locate the hanger on the back of the frame.",
                    "Carefully lower the frame onto the hook and check level."
                ],
                icon: Hammer,
                color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
                bgColor: "bg-amber-950/10",
                borderColor: "border-amber-500/20"
            };
        }

        // Default: Poster Tape (Standard Posters)
        return {
            title: "Damage-Free Poster Tape",
            description: "Secure your poster without damaging your paint. Strong hold, clean removal.",
            steps: [
                "Clean the wall area where you want to place the poster.",
                "Apply the adhesive strips to the back corners of the poster.",
                "Remove the backing from the wall-side of the strips.",
                "Press the poster firmly against the wall for 30 seconds."
            ],
            icon: StickyNote,
            color: "text-green-400 bg-green-400/10 border-green-400/20",
            bgColor: "bg-green-950/10",
            borderColor: "border-green-500/20"
        };
    };

    const currentContent = getContent();
    const Icon = currentContent.icon;

    return (
        <div className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700", className)}>
            <div className={cn("p-6 rounded-2xl border backdrop-blur-sm", currentContent.bgColor, currentContent.borderColor)}>
                <div className="flex items-start gap-4 mb-6">
                    <div className={cn("p-3 rounded-xl bg-black/40 border border-white/10", currentContent.color)}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-orbitron font-bold text-white mb-2">{currentContent.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{currentContent.description}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider opacity-80">Installation Steps</h4>
                    <div className="grid gap-4">
                        {currentContent.steps.map((step, idx) => (
                            <div key={idx} className="flex gap-4 group">
                                <div className={cn(
                                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border transition-colors",
                                    "bg-black/40 border-white/10 text-muted-foreground group-hover:border-white/30 group-hover:text-white"
                                )}>
                                    {idx + 1}
                                </div>
                                <p className="text-sm text-gray-300 pt-1.5 leading-relaxed group-hover:text-white transition-colors">
                                    {step}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstallationInstructions;
