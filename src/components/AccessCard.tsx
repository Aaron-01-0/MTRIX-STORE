import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Crown, Wifi, Snowflake } from 'lucide-react';

interface AccessCardProps {
    name?: string;
    email?: string;
    memberId?: string;
    isRevealed?: boolean;
}

const AccessCard = ({ name, email, memberId = "0000", isRevealed = false }: AccessCardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [rotate, setRotate] = useState({ x: 0, y: 0 });
    const [glare, setGlare] = useState({ x: 0, y: 0, opacity: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        // Calculate rotation (max 15 degrees)
        const rotateY = (mouseX / (rect.width / 2)) * 15;
        const rotateX = -(mouseY / (rect.height / 2)) * 15;

        setRotate({ x: rotateX, y: rotateY });

        // Calculate glare position
        const glareX = ((e.clientX - rect.left) / rect.width) * 100;
        const glareY = ((e.clientY - rect.top) / rect.height) * 100;

        setGlare({ x: glareX, y: glareY, opacity: 1 });
    };

    const handleMouseLeave = () => {
        setRotate({ x: 0, y: 0 });
        setGlare(prev => ({ ...prev, opacity: 0 }));
    };

    return (
        <div className="perspective-1000 w-full max-w-md mx-auto aspect-[1.586/1] cursor-pointer group">
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className={cn(
                    "relative w-full h-full transition-all duration-200 ease-out transform-style-3d rounded-2xl shadow-2xl",
                    isRevealed ? "shadow-gold/20" : "shadow-black/50"
                )}
                style={{
                    transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
                }}
            >
                {/* Card Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-neutral-900 rounded-2xl border border-white/10 overflow-hidden">
                    {/* Noise Texture */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

                    {/* Holiday Gradients: Red & Emerald */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-900/40 to-transparent rounded-bl-full blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-emerald-900/30 to-transparent rounded-tr-full blur-2xl" />

                    {/* Content */}
                    <div className="relative h-full p-6 flex flex-col justify-between z-10">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                                    <Snowflake className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-orbitron font-bold tracking-widest text-sm">MTRIX</h3>
                                    <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Holiday Edition</p>
                                </div>
                            </div>
                            <Wifi className="w-6 h-6 text-neutral-700 rotate-90" />
                        </div>

                        <div className="space-y-4">
                            {/* Chip */}
                            <div className="w-12 h-9 rounded bg-gradient-to-br from-neutral-200 via-neutral-400 to-neutral-600 border border-neutral-500 shadow-inner opacity-80" />

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Member Name</p>
                                    <p className={cn(
                                        "font-mono text-lg tracking-wider transition-all duration-500",
                                        isRevealed ? "text-white text-shadow-glow" : "text-neutral-600 blur-[2px]"
                                    )}>
                                        {name || "RESERVED FOR YOU"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">ID Number</p>
                                    <p className="font-mono text-gold text-shadow-gold tracking-widest">
                                        {memberId}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dynamic Glare Effect */}
                <div
                    className="absolute inset-0 rounded-2xl pointer-events-none mix-blend-overlay transition-opacity duration-200"
                    style={{
                        background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
                        opacity: glare.opacity,
                    }}
                />

                {/* Border Glow */}
                <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />
            </div>
        </div>
    );
};

export default AccessCard;
