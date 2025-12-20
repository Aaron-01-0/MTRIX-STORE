import React, { useState, useEffect, useRef, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWishes } from '@/hooks/useWishes';
import { cn } from '@/lib/utils';
import { validateEmailStrict } from '@/lib/email-validator';
import { Users, ArrowRight, Check, Sparkles, Send, Snowflake, Share2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import GlowingLogo from '@/components/home/GlowingLogo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChristmasAudio from '@/components/ChristmasAudio';

// Target Date: Dec 25, 2025
const TARGET_DATE = new Date('2025-12-25T00:00:00');

function calculateTimeLeft() {
    const difference = +TARGET_DATE - +new Date();
    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

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

// 1. Optimized Snowfall with requestAnimationFrame
const Snowfall = memo(() => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        let animationFrameId: number;

        const snowflakes: { x: number, y: number, r: number, d: number }[] = [];
        const maxSnowflakes = 100;

        for (let i = 0; i < maxSnowflakes; i++) {
            snowflakes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 3 + 1,
                d: Math.random()
            });
        }

        let angle = 0;

        function draw() {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.beginPath();
            for (let i = 0; i < maxSnowflakes; i++) {
                const f = snowflakes[i];
                ctx.moveTo(f.x, f.y);
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
            }
            ctx.fill();
            move();
            animationFrameId = requestAnimationFrame(draw);
        }

        function move() {
            angle += 0.01;
            for (let i = 0; i < maxSnowflakes; i++) {
                const f = snowflakes[i];
                f.y += f.d + 1 + f.r / 2;
                f.x += Math.sin(angle + f.d) * 0.5;

                if (f.y > height) {
                    snowflakes[i] = { x: Math.random() * width, y: -10, r: f.r, d: f.d };
                }
                if (f.x > width + 5 || f.x < -5) {
                    if (Math.sin(angle) > 0) snowflakes[i].x = -5;
                    else snowflakes[i].x = width + 5;
                }
            }
        }

        draw();

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
});

// 2. Isolated Countdown Component
const Countdown = memo(() => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex justify-center gap-4 md:gap-8 mb-16"
        >
            {Object.entries(timeLeft).map(([unit, value]) => (
                <div key={unit} className="flex flex-col items-center p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm min-w-[80px] md:min-w-[100px]">
                    <span className="text-3xl md:text-5xl font-bold text-white mb-2 font-mono">
                        {String(value).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest">{unit}</span>
                </div>
            ))}
        </motion.div>
    );
});

const ComingSoon = () => {
    const [email, setEmail] = useState('');
    const [wish, setWish] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [wishStatus, setWishStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [showWishes, setShowWishes] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // OTP State
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');

    useEffect(() => {
        if (status === 'error' || errorMessage) {
            const timer = setTimeout(() => {
                setStatus('idle');
                setErrorMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [status, errorMessage]);

    // Wishes Hook
    const { wishes, loading: wishesLoading, submitWish } = useWishes();

    // Counter State (Legacy logic)
    const [baseCount] = useState(() => 1420 + Math.floor(Math.random() * 41));
    const [realCount, setRealCount] = useState(0);
    const [fakeCount, setFakeCount] = useState(() => {
        const saved = localStorage.getItem('mtrix_fake_count');
        return saved ? parseInt(saved, 10) : 0;
    });
    const subscriberCount = baseCount + realCount + fakeCount;

    const [isMobile, setIsMobile] = useState(false);
    const [name, setName] = useState('');

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Optimized: Only fetch real count once, handle fake count in local interval but don't re-render parent if possible.
    // Actually, subscriberCount usage means we MUST re-render. 
    // But let's keep the interval logic simpler or memoize the heavy parts.
    useEffect(() => {
        localStorage.setItem('mtrix_fake_count', fakeCount.toString());
        const fetchCount = async () => {
            const { count } = await supabase.from('launch_subscribers' as any).select('*', { count: 'exact', head: true });
            if (count !== null) setRealCount(count);
        };
        fetchCount();
        const fakeActivity = setInterval(() => { if (Math.random() > 0.4) setFakeCount(prev => prev + 1); }, 2000);
        return () => clearInterval(fakeActivity);
    }, []);


    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        // Strict Validation
        const validation = validateEmailStrict(email);
        if (!validation.valid) {
            setErrorMessage(validation.error || 'Invalid email');
            return;
        }

        setStatus('loading');
        try {
            const { error } = await supabase.functions.invoke('send-otp', {
                body: { email }
            });

            if (error) throw error;

            setStatus('idle');
            setOtpSent(true);
        } catch (error: any) {
            console.error('Error:', error);
            setStatus('error');
            setErrorMessage(error.message || 'Failed to send verification code.');
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || otp.length < 6) return;

        setStatus('loading');
        try {
            const { data, error } = await supabase.functions.invoke('verify-otp', {
                body: { email, otp }
            });

            if (error) throw error;

            if (!data.valid) {
                setStatus('error');
                setErrorMessage(data.message || 'Invalid code');
                return;
            }

            setStatus('success');
            setRealCount(prev => prev + 1);
        } catch (error: any) {
            console.error('Error:', error);
            setStatus('error');
            setErrorMessage(error.message || 'Verification failed.');
        }
    };

    const containsExplicitContent = (text: string) => {
        const explicitTerms = ['bad', 'ugly', 'hate', 'stupid', 'idiot', 'scam', 'fake'];
        const lowerText = text.toLowerCase();
        return explicitTerms.some(term => lowerText.includes(term));
    };

    const handleWishSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!wish.trim() || !name.trim()) return;

        if (containsExplicitContent(wish) || containsExplicitContent(name)) {
            setWishStatus('error');
            setTimeout(() => setWishStatus('idle'), 3000);
            return;
        }

        setWishStatus('sending');
        const res = await submitWish(wish, name, email);
        if (res.error) {
            setWishStatus('error');
        } else {
            setWishStatus('sent');
            setWish('');
            setTimeout(() => setWishStatus('idle'), 3000);
        }
    };

    const handleShare = () => {
        const text = "I just made a wish for the Christmas Drop at mtrix.store 🎄✨ #MTRIX";
        const url = "https://mtrix.store";

        if (navigator.share) {
            navigator.share({ title: 'MTRIX Christmas', text, url }).catch(console.error);
        } else {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-red-500/30">
            {/* Background & Effects - Static / GPU accelerated */}
            <div className="absolute inset-0 bg-black pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-red-900/40 rounded-full blur-[120px] animate-pulse will-change-transform" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-green-900/30 rounded-full blur-[120px] animate-pulse delay-1000 will-change-transform" />
                <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-gold/10 rounded-full blur-[100px] animate-pulse delay-500 will-change-transform" />
            </div>

            <Snowfall />

            {/* Glowing Logo */}
            <GlowingLogo className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none" fontSize={isMobile ? 100 : 250} />

            <div className="z-10 w-full max-w-4xl mx-auto px-4 flex flex-col items-center justify-center text-center relative py-12">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="space-y-6 mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-gold/5 backdrop-blur-md mb-4">
                        <Snowflake className="w-4 h-4 text-gold animate-spin-slow" />
                        <span className="text-xs font-bold tracking-widest text-gold uppercase">Christmas Drop 2025</span>
                    </div>

                    <h1 className="text-4xl md:text-7xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-white to-green-500 animate-gradient-x drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        COMING SOON
                    </h1>

                    <p className="text-neutral-400 text-lg max-w-lg mx-auto leading-relaxed">
                        The store is currently locked. We are preparing something special for the holidays.
                    </p>
                </motion.div>

                <Countdown />

                {/* Interactive Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">

                    {/* Access Form */}
                    <div className="bg-black/40 border border-white/10 p-6 rounded-2xl backdrop-blur-xl relative">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-gold" />
                            {otpSent && status !== 'success' ? 'Verify Code' : 'Join Valid List'}
                            <span className="text-xs ml-auto font-mono text-neutral-400">{subscriberCount.toLocaleString()} Waiting</span>
                        </h3>

                        {status === 'success' ? (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3 text-green-400">
                                <Check className="w-6 h-6" />
                                <div className="text-left">
                                    <p className="font-bold text-sm">You are on the list!</p>
                                    <p className="text-xs opacity-80">Wishes Unlocked. Make a wish!</p>
                                </div>
                            </div>
                        ) : otpSent ? (
                            <form onSubmit={handleVerifyOtp} className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-xs text-neutral-400 text-left">Code sent to {email}</p>
                                    <Input
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        className={cn(
                                            "bg-white/5 border-white/10 h-11 focus:border-gold/50 transition-all duration-300 text-center tracking-[0.5em] text-lg font-mono",
                                            errorMessage && "border-red-500/50 focus:border-red-500"
                                        )}
                                        value={otp}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            setOtp(val);
                                            if (errorMessage) setErrorMessage('');
                                        }}
                                        required
                                    />
                                    {errorMessage && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-red-400 text-xs pl-1 font-medium flex items-center gap-1"
                                        >
                                            <span className="w-1 h-1 rounded-full bg-red-400" />
                                            {errorMessage}
                                        </motion.p>
                                    )}
                                </div>
                                <Button type="submit" disabled={status === 'loading' || otp.length < 6} className="w-full bg-white text-black hover:bg-gold font-bold h-11">
                                    {status === 'loading' ? 'Verifying...' : 'Unlock Wishes'}
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => { setOtpSent(false); setOtp(''); }}
                                    className="text-xs text-neutral-500 hover:text-white underline underline-offset-2"
                                >
                                    Change Email
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleSubscribe} className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        type="email"
                                        placeholder="Enter your email"
                                        className={cn(
                                            "bg-white/5 border-white/10 h-11 focus:border-gold/50 transition-all duration-300",
                                            errorMessage && "border-red-500/50 focus:border-red-500"
                                        )}
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (errorMessage) setErrorMessage('');
                                        }}
                                        required
                                    />
                                    {errorMessage && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-red-400 text-xs pl-1 font-medium flex items-center gap-1"
                                        >
                                            <span className="w-1 h-1 rounded-full bg-red-400" />
                                            {errorMessage}
                                        </motion.p>
                                    )}
                                </div>
                                <Button type="submit" disabled={status === 'loading'} className="w-full bg-white text-black hover:bg-gold font-bold h-11">
                                    {status === 'loading' ? 'Sending Code...' : 'Get Early Access'}
                                </Button>
                            </form>
                        )}
                    </div>

                    {/* Wishes Section */}
                    <div className="bg-black/40 border border-white/10 p-6 rounded-2xl backdrop-blur-xl flex flex-col h-[350px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-red-500 shrink-0" />
                                <span>Make a Wish</span>
                            </h3>
                            <div className="flex gap-1">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="w-2 h-2 rounded-full bg-gold" />
                            </div>
                        </div>

                        {/* Recent Wishes Feed */}
                        <ScrollArea className="flex-1 mb-4 pr-4 -mr-4">
                            <div className="space-y-3">
                                {wishesLoading ? (
                                    <div className="text-center text-neutral-500 text-sm py-4">Loading wishes...</div>
                                ) : wishes.length === 0 ? (
                                    <div className="text-center text-neutral-500 text-sm py-4">Be the first to wish!</div>
                                ) : (
                                    wishes.map((w) => (
                                        <div key={w.id} className="bg-white/5 border border-white/5 p-3 rounded-lg text-left animate-in fade-in slide-in-from-bottom-2">
                                            <p className="text-sm text-neutral-300">
                                                <span className="text-gold font-semibold mr-2">{w.name || 'Anonymous'}:</span>
                                                {w.message}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>

                        {/* Wish Input */}
                        <div className="relative mt-auto space-y-2">
                            {status === 'success' ? (
                                <form onSubmit={handleWishSubmit} className="space-y-2">
                                    <Input
                                        placeholder="Your Name"
                                        className="bg-white/5 border-white/10 h-9 focus:border-red-500/50 text-sm"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        maxLength={30}
                                        required
                                    />
                                    <div className="relative">
                                        <Input
                                            placeholder="Make a wish..."
                                            className="bg-white/5 border-white/10 pr-10 focus:border-red-500/50 h-10"
                                            value={wish}
                                            onChange={(e) => setWish(e.target.value)}
                                            maxLength={100}
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={wishStatus === 'sending' || !wish.trim() || !name.trim()}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white disabled:opacity-50"
                                        >
                                            {wishStatus === 'sent' ? <Check className="w-4 h-4 text-green-500" /> : <Send className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="bg-white/5 border border-white/5 rounded-lg p-3 text-center">
                                    <p className="text-xs text-neutral-400">
                                        {otpSent ? 'Enter code to unlock wishes' : 'Join the list above to unlock wishes'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Share Button */}
                <button
                    onClick={handleShare}
                    className="mt-8 mx-auto flex items-center justify-center gap-2 text-neutral-400 hover:text-gold transition-colors py-2 px-6 rounded-full border border-white/10 bg-black/40 backdrop-blur-md hover:bg-white/10"
                >
                    <Share2 className="w-4 h-4" />
                    Share the Spirit
                </button>

            </div>

            <ChristmasAudio />

            {/* Admin Link */}
            <div className="absolute bottom-4 text-center w-full z-20">
                <a href="/auth" className="text-neutral-800 hover:text-neutral-600 text-[10px] uppercase tracking-widest transition-colors">
                    Admin Access
                </a>
            </div>
        </div>
    );
};

export default ComingSoon;
