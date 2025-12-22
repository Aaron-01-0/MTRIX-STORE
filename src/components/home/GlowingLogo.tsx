import { useEffect, useRef } from 'react';

interface GlowingLogoProps {
    className?: string;
    fontSize?: number;
}

const GlowingLogo = ({ className, fontSize = 100 }: GlowingLogoProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mouse = useRef({ x: 0, y: 0, radius: 100 });
    const particles = useRef<Particle[]>([]);

    class Particle {
        x: number;
        y: number;
        originX: number;
        originY: number;
        size: number;
        color: string;
        vx: number;
        vy: number;
        friction: number;
        ease: number;

        constructor(x: number, y: number) {
            this.x = x;
            this.y = y;
            this.originX = x;
            this.originY = y;
            this.size = Math.random() * 2 + 1; // Random size
            this.color = '#FFD700'; // Gold color
            this.vx = 0;
            this.vy = 0;
            this.friction = 0.95;
            this.ease = 0.15;
        }

        draw(ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        update() {
            const dx = mouse.current.x - this.x;
            const dy = mouse.current.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const force = -mouse.current.radius / distance;
            const angle = Math.atan2(dy, dx);

            if (distance < mouse.current.radius) {
                this.vx += force * Math.cos(angle);
                this.vy += force * Math.sin(angle);
            }

            this.x += (this.vx *= this.friction) + (this.originX - this.x) * this.ease;
            this.y += (this.vy *= this.friction) + (this.originY - this.y) * this.ease;
        }
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const init = () => {
            if (!containerRef.current) return;

            // Set canvas size
            canvas.width = containerRef.current.clientWidth;
            canvas.height = containerRef.current.clientHeight;

            particles.current = [];

            // Create offscreen canvas for text
            const textCanvas = document.createElement('canvas');
            const textCtx = textCanvas.getContext('2d');
            if (!textCtx) return;

            textCanvas.width = canvas.width;
            textCanvas.height = canvas.height;

            // Draw text
            textCtx.fillStyle = 'white';
            textCtx.font = `900 ${fontSize}px Orbitron`; // Use dynamic font size
            textCtx.textAlign = 'center';
            textCtx.textBaseline = 'middle';
            // Position at the top (fontSize ensures it's fully visible + some padding)
            textCtx.fillText('MTRIX', textCanvas.width / 2, fontSize * 0.8);

            // Get pixel data
            const pixels = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height).data;

            // Create particles from pixels
            // Skip pixels for performance (step = 12) - Higher number = fewer particles = better performance
            const step = 12;
            for (let y = 0; y < textCanvas.height; y += step) {
                for (let x = 0; x < textCanvas.width; x += step) {
                    const index = (y * textCanvas.width + x) * 4;
                    if (pixels[index + 3] > 128) { // If alpha > 128
                        particles.current.push(new Particle(x, y));
                    }
                }
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.current.forEach(particle => {
                particle.update();
                particle.draw(ctx);
            });
            requestAnimationFrame(animate);
        };

        init();
        animate();

        const handleResize = () => {
            init();
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            mouse.current.x = e.clientX - rect.left;
            mouse.current.y = e.clientY - rect.top;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            mouse.current.x = e.touches[0].clientX - rect.left;
            mouse.current.y = e.touches[0].clientY - rect.top;
        };

        // Reset mouse position when leaving canvas
        const handleMouseLeave = () => {
            mouse.current.x = -1000;
            mouse.current.y = -1000;
        }

        window.addEventListener('resize', handleResize);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('mouseleave', handleMouseLeave);
        canvas.addEventListener('touchend', handleMouseLeave);

        return () => {
            window.removeEventListener('resize', handleResize);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            canvas.removeEventListener('touchend', handleMouseLeave);
        };
    }, [fontSize]);

    return (
        <div ref={containerRef} className={`overflow-hidden ${className || 'w-full h-[400px] relative'}`}>
            <canvas
                ref={canvasRef}
                className="block w-full h-full touch-none cursor-crosshair relative z-10"
            />

            <div className="absolute bottom-4 left-0 w-full text-center text-gold/30 text-xs font-mono animate-pulse pointer-events-none z-20">
                TOUCH & DRAG TO RESHAPE
            </div>
        </div>
    );
};

export default GlowingLogo;
