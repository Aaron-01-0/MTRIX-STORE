import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import santaSleigh3d from '../assets/santa_sleigh_3d.png';

interface SantaRevealProps {
    onComplete: () => void;
}

const SantaReveal: React.FC<SantaRevealProps> = ({ onComplete }) => {
    const [isRevealed, setIsRevealed] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Harsh Snowfall Effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const particles: any[] = [];
        const particleCount = 200;

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 2 + 1,
                speedY: Math.random() * 5 + 2,
                speedX: Math.random() * 4 + 2,
                color: '#FFFFFF',
                opacity: Math.random() * 0.5 + 0.3
            });
        }

        let animationFrameId: number;

        function draw() {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particleCount; i++) {
                const p = particles[i];
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.opacity;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, true);
                ctx.fill();
            }
            update();
            animationFrameId = requestAnimationFrame(draw);
        }

        function update() {
            for (let i = 0; i < particleCount; i++) {
                const p = particles[i];
                p.y += p.speedY;
                p.x += p.speedX;

                if (p.y > height) {
                    p.y = -10;
                    p.x = Math.random() * width - width * 0.5;
                }
                if (p.x > width) {
                    p.x = -10;
                    p.y = Math.random() * height;
                }
            }
        }

        draw();

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', handleResize);
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <motion.div
            className="fixed inset-0 z-50 bg-black overflow-hidden flex items-center justify-center perspective-[1000px]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
        >
            {/* 3D Moving Grid Floor */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[50%] left-[-50%] w-[200%] h-[100%] bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] [transform:rotateX(60deg)_translateZ(-200px)] animate-[grid-move_2s_linear_infinite]" />
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black via-transparent to-black" />
            </div>

            {/* Harsh Snow Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-80" />

            {/* 3D Animation Container */}
            <div className="relative w-full h-full flex items-center transform-style-3d">

                {/* Red Cloth (Revealer) - 3D Ribbon Style */}
                <motion.div
                    className="absolute left-0 h-[300px] bg-gradient-to-r from-red-900 to-red-600 flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.5)] border-r-4 border-gold/50"
                    initial={{ width: 0, rotateY: 15, skewX: -10 }}
                    animate={{ width: "100%", rotateY: 0, skewX: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 30,
                        damping: 10,
                        mass: 2,
                        delay: 0.5,
                        duration: 2.5
                    }}
                    style={{ transformOrigin: "left center" }}
                    onAnimationComplete={() => {
                        setIsRevealed(true);
                        setTimeout(onComplete, 3500);
                    }}
                >
                    {/* Revealed Text - 3D Pop Out */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, z: -100 }}
                        animate={{ opacity: isRevealed ? 1 : 0, scale: isRevealed ? 1 : 0.5, z: isRevealed ? 50 : -100 }}
                        transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
                        className="text-center p-8 min-w-[400px]"
                    >
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2 drop-shadow-lg [text-shadow:0_0_20px_rgba(255,255,255,0.5)]">
                            MTRIX 2025
                        </h2>
                        <p className="text-xl md:text-2xl text-gold font-bold tracking-[0.5em] uppercase drop-shadow-md">
                            Never The Same
                        </p>
                    </motion.div>
                </motion.div>

                {/* Santa Sleigh - 3D Flight */}
                <motion.img
                    src={santaSleigh3d}
                    alt="Santa Sleigh"
                    className="absolute h-[350px] object-contain z-10 drop-shadow-2xl mix-blend-screen"
                    initial={{ left: "-300px", rotateY: 45, rotateZ: -10, z: 200 }}
                    animate={{ left: "100%", rotateY: 0, rotateZ: 0, z: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 30,
                        damping: 10,
                        mass: 2,
                        delay: 0.5,
                        duration: 2.5
                    }}
                    style={{ x: "-50%" }}
                />
            </div>

            {/* Custom Keyframes for Grid */}
            <style>{`
                @keyframes grid-move {
                    0% { transform: rotateX(60deg) translateY(0); }
                    100% { transform: rotateX(60deg) translateY(50px); }
                }
            `}</style>
        </motion.div>
    );
};

export default SantaReveal;
