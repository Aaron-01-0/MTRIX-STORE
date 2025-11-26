import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag, Hand } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useAnimationFrame } from 'framer-motion';

const SetupBuilder = () => {
    const [isHovering, setIsHovering] = useState(false);

    // Motion values for rotation
    const rotateX = useMotionValue(-15);
    const rotateY = useMotionValue(45);

    // Smooth springs for physics feel
    const springRotateX = useSpring(rotateX, { stiffness: 150, damping: 20 });
    const springRotateY = useSpring(rotateY, { stiffness: 150, damping: 20 });

    // Auto-rotation loop
    useAnimationFrame((t, delta) => {
        if (!isHovering) {
            rotateY.set(rotateY.get() + (delta * 0.02));
            rotateX.set(rotateX.get() + (delta * 0.005)); // Subtle X rotation
        }
    });

    const handlePan = (event: any, info: any) => {
        rotateY.set(rotateY.get() + info.delta.x * 0.5);
        rotateX.set(rotateX.get() - info.delta.y * 0.5);
    };

    return (
        <section className="relative min-h-[80vh] bg-black overflow-hidden flex items-center justify-center py-20">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold/5 via-black to-black" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

            <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                {/* Text Content */}
                <div className="space-y-8 order-2 lg:order-1 select-none">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gold animate-fade-in">
                        <ShoppingBag className="w-4 h-4" />
                        <span className="text-sm font-medium tracking-wide">STREETWEAR x LIFESTYLE</span>
                    </div>

                    <h2 className="text-5xl md:text-7xl font-orbitron font-black text-white leading-tight">
                        CURATED <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-white to-gold animate-gradient-x">
                            ESSENTIALS
                        </span>
                    </h2>

                    <p className="text-xl text-gray-400 max-w-xl font-light leading-relaxed">
                        From statement totes to premium desk mats. Elevate your daily carry and
                        workspace with our exclusive collection of accessories.
                    </p>

                    <div className="flex flex-wrap gap-4 pt-4">
                        <Link to="/catalog">
                            <Button className="bg-gradient-gold text-black hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] text-lg px-8 py-6 rounded-none skew-x-[-10deg] transition-all duration-300 hover:scale-105">
                                <span className="skew-x-[10deg] font-bold tracking-wider flex items-center gap-2">
                                    SHOP DROP <ArrowRight className="w-5 h-5" />
                                </span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* 360 Revolving Cube */}
                <div className="order-1 lg:order-2 flex flex-col justify-center items-center h-[400px] perspective-1000">

                    {/* Interaction Hint */}
                    <div className="mb-8 text-gold/50 text-sm font-mono flex items-center gap-2 animate-pulse">
                        <Hand className="w-4 h-4" /> HOVER TO PAUSE • DRAG TO ROTATE
                    </div>

                    <motion.div
                        className="relative w-72 h-72 [transform-style:preserve-3d] cursor-grab active:cursor-grabbing"
                        onHoverStart={() => setIsHovering(true)}
                        onHoverEnd={() => setIsHovering(false)}
                        onPan={handlePan}
                    >

                        {/* Rotating Container */}
                        <motion.div
                            style={{ rotateX: springRotateX, rotateY: springRotateY }}
                            className="absolute inset-0 [transform-style:preserve-3d]"
                        >
                            {/* Central Cube */}
                            <div className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]">

                                {/* Front Face - TOTES */}
                                <div className="absolute w-56 h-56 bg-black border-4 border-white flex items-center justify-center [transform:translateZ(112px)] shadow-[0_0_30px_rgba(255,255,255,0.1)] select-none">
                                    <div className="text-center pointer-events-none">
                                        <span className="block text-5xl font-black text-white tracking-tighter">TOTES</span>
                                        <span className="text-xs font-bold bg-gold text-black px-2 py-1 mt-2 inline-block">CANVAS SERIES</span>
                                    </div>
                                </div>

                                {/* Back Face - POSTERS */}
                                <div className="absolute w-56 h-56 bg-white border-4 border-black flex items-center justify-center [transform:translateZ(-112px)_rotateY(180deg)] select-none">
                                    <div className="text-center pointer-events-none">
                                        <span className="block text-5xl font-black text-black tracking-tighter">ART</span>
                                        <span className="text-xs font-bold bg-black text-white px-2 py-1 mt-2 inline-block">POSTERS</span>
                                    </div>
                                </div>

                                {/* Right Face - MATS */}
                                <div className="absolute w-56 h-56 bg-gold border-4 border-black flex items-center justify-center [transform:rotateY(90deg)_translateZ(112px)] select-none">
                                    <div className="text-center pointer-events-none">
                                        <span className="block text-5xl font-black text-black tracking-tighter">MATS</span>
                                        <span className="text-xs font-bold bg-white text-black px-2 py-1 mt-2 inline-block">DESK PADS</span>
                                    </div>
                                </div>

                                {/* Left Face - APPAREL */}
                                <div className="absolute w-56 h-56 bg-zinc-900 border-4 border-gold flex items-center justify-center [transform:rotateY(-90deg)_translateZ(112px)] select-none">
                                    <div className="text-center pointer-events-none">
                                        <span className="block text-4xl font-black text-gold tracking-tighter">STREET</span>
                                        <span className="text-xs font-bold bg-white text-black px-2 py-1 mt-2 inline-block">WEAR</span>
                                    </div>
                                </div>

                                {/* Top Face - LOGO */}
                                <div className="absolute w-56 h-56 bg-black border-4 border-white flex items-center justify-center [transform:rotateX(90deg)_translateZ(112px)] select-none">
                                    <span className="text-4xl font-orbitron font-bold text-white pointer-events-none">MTRIX</span>
                                </div>

                                {/* Bottom Face - YEAR */}
                                <div className="absolute w-56 h-56 bg-black border-4 border-gold flex items-center justify-center [transform:rotateX(-90deg)_translateZ(112px)] select-none">
                                    <span className="text-4xl font-orbitron font-bold text-gold pointer-events-none">2025</span>
                                </div>

                            </div>

                        </motion.div>

                    </motion.div>
                </div>

            </div>
        </section>
    );
};

export default SetupBuilder;
