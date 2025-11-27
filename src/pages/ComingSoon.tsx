import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Users, ArrowRight, Check } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import SantaReveal from '@/components/SantaReveal';

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
    const [subscriberCount, setSubscriberCount] = useState<number>(1420); // Start with base count
    const [showIntro, setShowIntro] = useState(true);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    // Fetch Subscriber Count
    useEffect(() => {
        const fetchCount = async () => {
            const { count, error } = await supabase
                .from('launch_subscribers' as any)
                .select('*', { count: 'exact', head: true });

            if (!error && count !== null) {
                setSubscriberCount(1420 + count); // Add real count to base
            }
        };
        fetchCount();

        // Real-time subscription
        const channel = supabase
            .channel('public:launch_subscribers')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'launch_subscribers' }, () => {
                setSubscriberCount(prev => prev + 1);
            })
            .subscribe();

        // Fake "Live" Activity - Randomly increment count to simulate signups
        const fakeActivity = setInterval(() => {
            if (Math.random() > 0.6) { // 40% chance to increment every interval
                setSubscriberCount(prev => prev + 1);
            }
        }, 3000); // Check every 3 seconds

        return () => {
            supabase.removeChannel(channel);
            clearInterval(fakeActivity);
        };
    }, []);

    // Snowfall Effect
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
        const particleCount = 100;

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 2 + 0.5,
                speedY: Math.random() * 1 + 0.5,
                speedX: (Math.random() - 0.5) * 0.5,
                color: Math.random() > 0.5 ? '#FFD700' : '#FFFFFF', // Gold or White
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
                    p.x = Math.random() * width;
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

    const { user } = useAuth();

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
                    setStatus('success');
                    return;
                }
                throw error;
            }

            await supabase.functions.invoke('subscribe-launch', {
                body: { email }
            });

            setStatus('success');
            setEmail('');
            setSubscriberCount(prev => prev + 1);
        } catch (error) {
            console.error('Error:', error);
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-gold/30">
            {/* Intro Animation */}
            <AnimatePresence>
                {showIntro && (
                    <SantaReveal onComplete={() => setShowIntro(false)} />
                )}
            </AnimatePresence>

            {/* Premium Background */}
            <div className="absolute inset-0 bg-black">
                {/* Christmas Gradients */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-900/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px] animate-pulse delay-1000" />
                <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-gold/5 rounded-full blur-[100px] animate-pulse delay-500" />
            </div>

            {/* Snowfall Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-60" />

            {/* Main Content - Centered */}
            <div className={`z-10 w-full max-w-4xl mx-auto px-4 flex flex-col items-center justify-center text-center relative transition-opacity duration-1000 ${showIntro ? 'opacity-0' : 'opacity-100'}`}>

                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-forwards w-full max-w-2xl">
                    <div>
                        <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-400">
                            MTRIX
                        </h1>
                        <p className="text-lg md:text-xl text-gold/80 tracking-[0.3em] uppercase font-medium">
                            The Winter Collection
                        </p>
                    </div>

                    <p className="text-neutral-400 text-lg max-w-md mx-auto leading-relaxed">
                        Unwrapping the future of fashion. Secure your spot on the guest list for our exclusive holiday drop.
                    </p>

                    {/* Countdown */}
                    <div className="flex justify-center gap-6 md:gap-8">
                        {Object.entries(timeLeft).map(([unit, value]) => (
                            <div key={unit} className="flex flex-col items-center">
                                <span className="text-3xl md:text-4xl font-bold text-white mb-1 font-mono">
                                    {String(value).padStart(2, '0')}
                                </span>
                                <span className="text-[10px] text-neutral-600 uppercase tracking-widest">{unit}</span>
                            </div>
                        ))}
                    </div>

                    {/* Scarcity Counter */}
                    <div className="max-w-md mx-auto bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
                        <div className="flex justify-between items-end mb-2">
                            <div className="flex items-center gap-2 text-gold">
                                <Users className="w-4 h-4" />
                                <span className="font-bold text-sm uppercase tracking-wider">Spots Claimed</span>
                            </div>
                            <span className="font-mono text-white font-bold">
                                {subscriberCount.toLocaleString()}
                            </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-2 text-right">
                            Join the waitlist
                        </p>
                    </div>

                    {/* Notify Form */}
                    <div className="max-w-md mx-auto">
                        {user ? (
                            <div className="bg-gold/10 border border-gold/20 p-6 rounded-xl backdrop-blur-md">
                                <p className="text-xl font-bold text-gold mb-2">Access Granted</p>
                                <p className="text-neutral-400 text-sm mb-4">You are on the list, {user.user_metadata?.full_name || 'Member'}.</p>
                                <div className="flex items-center gap-2 text-xs text-gold/60 uppercase tracking-widest justify-center">
                                    <Check className="w-4 h-4" />
                                    Spot Secured
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                    className="w-full bg-white/5 border border-white/10 text-white pl-6 pr-32 py-4 rounded-full focus:outline-none focus:border-gold/50 focus:bg-white/10 transition-all placeholder:text-neutral-600"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={status === 'loading' || status === 'success'}
                                    className="absolute right-1.5 top-1.5 bottom-1.5 bg-white text-black font-bold px-6 rounded-full hover:bg-gold hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {status === 'loading' ? 'Processing...' : status === 'success' ? 'Joined' : (
                                        <>
                                            Join <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                        {status === 'success' && !user && (
                            <p className="text-gold mt-4 text-sm font-medium animate-in fade-in duration-500">
                                Welcome to the club.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComingSoon;
