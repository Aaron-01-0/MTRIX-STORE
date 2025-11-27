import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Define outside to avoid initialization errors
const TARGET_DATE = new Date('2025-12-25T00:00:00');

function calculateTimeLeft() {
    const difference = +TARGET_DATE - +new Date();
    let timeLeft = {};

    if (difference > 0) {
        timeLeft = {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        };
    }
    return timeLeft;
}

const ComingSoon = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const [showSecret, setShowSecret] = useState(false);
    const [password, setPassword] = useState('');
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    // Snowfall & Pine Needles Effect
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
        const particleCount = 120;

        for (let i = 0; i < particleCount; i++) {
            const isNeedle = Math.random() > 0.6; // 40% Needles
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 2 + 0.5, // radius or length
                d: Math.random() * particleCount,
                type: isNeedle ? 'needle' : 'snow',
                color: isNeedle
                    ? (Math.random() > 0.5 ? '#059669' : '#10B981') // Emerald/Green
                    : (Math.random() > 0.9 ? '#FFD700' : '#FFFFFF'), // Gold/White
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 0.05
            });
        }

        let animationFrameId: number;
        let angle = 0;

        function draw() {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particleCount; i++) {
                const p = particles[i];

                ctx.save();
                if (p.type === 'needle') {
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(0, 0, 2, 8); // Thin needle shape
                } else {
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, true);
                    ctx.fill();
                }
                ctx.restore();
            }
            update();
            animationFrameId = requestAnimationFrame(draw);
        }

        function update() {
            angle += 0.01;
            for (let i = 0; i < particleCount; i++) {
                const p = particles[i];
                p.y += Math.cos(angle + p.d) + 1 + p.r / 2;
                p.x += Math.sin(angle) * 2;
                p.rotation += p.rotationSpeed;

                if (p.x > width + 5 || p.x < -5 || p.y > height) {
                    if (i % 3 > 0) {
                        particles[i] = { ...p, x: Math.random() * width, y: -10 };
                    } else {
                        if (Math.sin(angle) > 0) {
                            particles[i] = { ...p, x: -5, y: Math.random() * height };
                        } else {
                            particles[i] = { ...p, x: width + 5, y: Math.random() * height };
                        }
                    }
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');

        try {
            const { error } = await supabase
                .from('launch_subscribers' as any)
                .insert([{ email }]);

            if (error) {
                if (error.code === '23505') { // Unique violation
                    setStatus('success'); // Pretend success if already subscribed
                    return;
                }
                throw error;
            }

            // Trigger Edge Function for email (optional, can be done via database trigger too)
            await supabase.functions.invoke('subscribe-launch', {
                body: { email }
            });

            setStatus('success');
            setEmail('');
        } catch (error) {
            console.error('Error:', error);
            setStatus('error');
        }
    };

    const handleSecretLogin = () => {
        if (password === 'neo') {
            localStorage.setItem('mtrix_bypass', 'true');
            window.location.href = '/';
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-red-500/30">
            {/* Premium Background */}
            <div className="absolute inset-0 bg-black">
                {/* Christmas Gradients: Gold, Emerald, Red */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-yellow-600/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/10 rounded-full blur-[120px] animate-pulse delay-1000" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-900/10 rounded-full blur-[120px] animate-pulse delay-2000" />
            </div>

            {/* Snowfall Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-60" />

            <div className="z-10 text-center px-4 max-w-2xl w-full relative">
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-forwards">
                    <h1 className="text-6xl md:text-9xl font-black mb-6 tracking-tighter text-white">
                        MTRIX
                    </h1>
                    <p className="text-lg md:text-xl text-neutral-400 mb-16 tracking-[0.2em] uppercase font-medium">
                        Unwrapping Christmas 2025
                    </p>
                </div>

                {/* Countdown */}
                <div className="grid grid-cols-4 gap-4 md:gap-8 mb-20">
                    {Object.entries(timeLeft).map(([unit, value]) => (
                        <div key={unit} className="flex flex-col items-center">
                            <span className="text-4xl md:text-6xl font-bold text-white mb-2 font-mono">
                                {String(value).padStart(2, '0')}
                            </span>
                            <span className="text-[10px] md:text-xs text-neutral-500 uppercase tracking-widest">{unit}</span>
                        </div>
                    ))}
                </div>

                {/* Notify Form */}
                <div className="mb-16 max-w-md mx-auto">
                    <p className="text-neutral-400 mb-6 text-sm">Be the first to know when the collection drops.</p>
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="flex-1 bg-white/5 border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all placeholder:text-neutral-600"
                            required
                        />
                        <button
                            type="submit"
                            disabled={status === 'loading' || status === 'success'}
                            className="bg-white text-black font-bold px-8 py-3 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'loading' ? 'Joining...' : status === 'success' ? 'Joined' : 'Notify Me'}
                        </button>
                    </form>
                    {status === 'success' && (
                        <p className="text-emerald-400 mt-4 text-sm font-medium animate-in fade-in duration-500">
                            You're on the list.
                        </p>
                    )}
                </div>

                {/* Secret Access */}
                <div className="absolute -bottom-24 left-0 right-0 text-center">
                    <button
                        onClick={() => setShowSecret(!showSecret)}
                        className="text-neutral-900 hover:text-neutral-800 transition-colors"
                    >
                        π
                    </button>
                </div>

                {showSecret && (
                    <div className="mt-4 flex justify-center gap-2">
                        <input
                            type="password"
                            placeholder="Passkey"
                            className="bg-neutral-900 border border-neutral-800 text-white px-3 py-1 text-xs rounded"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            onClick={handleSecretLogin}
                            className="bg-neutral-800 text-neutral-400 text-xs px-3 py-1 rounded hover:bg-neutral-700"
                        >
                            Enter
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComingSoon;
