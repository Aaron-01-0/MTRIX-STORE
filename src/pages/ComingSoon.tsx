import React, { useState, useEffect, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
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
const TARGET_DATE = new Date('2025-12-25T00:00:00+05:30');

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
        const maxSnowflakes = 50; // Optimized from 100 for better performance

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
            const time = calculateTimeLeft();
            setTimeLeft(time);

            // Auto reload when countdown finishes
            if (time.days === 0 && time.hours === 0 && time.minutes === 0 && time.seconds === 0) {
                // Double check the date to be sure (client side clock sync fallback)
                const now = new Date();
                if (now >= TARGET_DATE) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000); // 2 second delay to see the zeros
                    clearInterval(timer);
                }
            }
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
    // Session & UI State
    const [email, setEmail] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false); // If true, we know the email
    const [activeTab, setActiveTab] = useState<'make-wish' | 'see-wishes'>('make-wish');

    // Wish State
    const [wish, setWish] = useState('');
    const [myWish, setMyWish] = useState<{ message: string, name: string } | null>(null);
    const [status, setStatus] = useState<'idle' | 'checking' | 'sending' | 'success' | 'existing' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Hooks
    const { wishes, loading: wishesLoading, submitWish, checkWishByEmail } = useWishes();
    const [isMobile, setIsMobile] = useState(false);
    const navigate = useNavigate();

    // Initial Load - Check Session & Redirect if Live
    useEffect(() => {
        document.title = "MTRIX Christmas Drop | Coming Soon";

        // Check if launch has happened
        if (new Date() >= TARGET_DATE) {
            navigate('/', { replace: true });
            return;
        }

        const savedEmail = sessionStorage.getItem('mtrix_user_email');
        if (savedEmail) {
            setEmail(savedEmail);
            handleEmailCheck(savedEmail, true);
        }

        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleEmailCheck = async (emailToCheck: string = email, isAutoCheck = false) => {
        if (!emailToCheck || !validateEmailStrict(emailToCheck).valid) {
            if (!isAutoCheck) setErrorMessage('Please enter a valid email');
            return;
        }

        setStatus('checking');
        setErrorMessage('');

        const res = await checkWishByEmail(emailToCheck);

        if (res.error) {
            setStatus('error');
            setErrorMessage('Something went wrong. Please try again.');
        } else {
            setIsAuthenticated(true);
            sessionStorage.setItem('mtrix_user_email', emailToCheck);
            if (res.wish) {
                setMyWish(res.wish);
                setStatus('existing');
            } else {
                setStatus('idle'); // Ready to make a wish
            }
        }
    };

    const handleWishSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!wish.trim()) return;

        if (containsExplicitContent(wish)) {
            setErrorMessage("Let's keep it positive! ✨");
            return;
        }

        setStatus('sending');
        // Use email as name if name input is removed as requested
        const res = await submitWish(wish, email, email);

        if (res.error) {
            setStatus('error');
            setErrorMessage(res.error);
        } else {
            setMyWish({ message: wish, name: email });
            setStatus('success');
            setWish('');
        }
    };

    const containsExplicitContent = (text: string) => {
        const explicitTerms = ['bad', 'ugly', 'hate', 'stupid', 'idiot', 'scam', 'fake'];
        const lowerText = text.toLowerCase();
        return explicitTerms.some(term => lowerText.includes(term));
    };

    const handleShare = () => {
        const text = "I just made a wish for the Christmas Drop at mtrix.store 🎄✨ #MTRIX";
        const url = "https://mtrix.store";
        if (navigator.share) navigator.share({ title: 'MTRIX Christmas', text, url }).catch(console.error);
        else window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    };

    // Calculate time left (keep existing logic)
    // ... (reusing existing Countdown component effectively by not touching it) ...

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-red-500/30">
            {/* Background & Effects */}
            <div className="absolute inset-0 bg-black pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-red-900/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-green-900/20 rounded-full blur-[100px]" />
                <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-gold/5 rounded-full blur-[80px]" />
            </div>

            <Snowfall />

            {/* Glowing Logo */}
            {/* Glowing Logo - Constrained to prevent stretching */}
            {/* Glowing Logo - Constrained to prevent stretching */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] h-[500px] z-0 opacity-40 mix-blend-screen pointer-events-none"
                role="img"
                aria-label="MTRIX Glowing Logo"
            >
                <GlowingLogo className="w-full h-full" fontSize={isMobile ? 80 : 180} />
            </div>

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
                        The store is currently locked. Make a wish to unlock the magic.
                    </p>
                </motion.div>

                <Countdown />

                {/* Main Interaction Area */}
                <div
                    className={cn(
                        "w-full bg-black/40 border border-white/10 rounded-2xl backdrop-blur-md overflow-hidden shadow-2xl transition-all duration-500 ease-in-out",
                        activeTab === 'see-wishes' ? "max-w-5xl" : "max-w-md"
                    )}
                >

                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setActiveTab('make-wish')}
                            className={cn(
                                "flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors relative",
                                activeTab === 'make-wish' ? "text-white" : "text-neutral-500 hover:text-neutral-300"
                            )}
                        >
                            Make a Wish
                            {activeTab === 'make-wish' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-green-500" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('see-wishes')}
                            className={cn(
                                "flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors relative",
                                activeTab === 'see-wishes' ? "text-white" : "text-neutral-500 hover:text-neutral-300"
                            )}
                        >
                            Community
                            {activeTab === 'see-wishes' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-green-500" />}
                        </button>
                    </div>

                    <div className="p-6 min-h-[300px] flex flex-col">
                        <AnimatePresence mode="wait">
                            {activeTab === 'make-wish' ? (
                                <motion.div
                                    key="make-wish"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex-1 flex flex-col"
                                >
                                    {!isAuthenticated ? (
                                        <div className="flex flex-col gap-4 justify-center flex-1">
                                            <div className="text-center space-y-2">
                                                <h3 className="text-xl font-bold text-white">Identify Yourself</h3>
                                                <p className="text-neutral-400 text-sm">Enter your email to make a wish or see your stats.</p>
                                            </div>
                                            <form onSubmit={(e) => { e.preventDefault(); handleEmailCheck(); }} className="space-y-4 mt-4">
                                                <Input
                                                    type="email"
                                                    placeholder="Enter your email"
                                                    className="bg-white/5 border-white/10 h-11 focus:border-gold/50 text-center"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                />
                                                {errorMessage && <p className="text-red-400 text-xs text-center">{errorMessage}</p>}
                                                <Button type="submit" disabled={status === 'checking'} className="w-full bg-white text-black hover:bg-gold font-bold h-11">
                                                    {status === 'checking' ? 'Checking...' : 'Continue'}
                                                </Button>
                                            </form>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col flex-1">
                                            {status === 'existing' || status === 'success' ? (
                                                <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500 flex-1 flex flex-col justify-center">
                                                    <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                                        <Sparkles className="w-8 h-8 text-gold animate-pulse" />
                                                    </div>

                                                    <div>
                                                        <h3 className="text-2xl font-bold text-white mb-2">
                                                            {status === 'success' ? 'Wish Granted!' : 'Wish Recorded'}
                                                        </h3>
                                                        <p className="text-neutral-400 text-sm mb-4">
                                                            {status === 'success' ? 'Your wish has been cast into the Matrix.' : 'You have already made a wish.'}
                                                        </p>
                                                        <div className="bg-white/5 border border-white/10 p-4 rounded-xl italic text-gold/90">
                                                            "{myWish?.message}"
                                                        </div>
                                                        <p className="text-xs text-neutral-500 mt-2">
                                                            Identity: {email}
                                                        </p>
                                                    </div>

                                                    <div className="bg-gradient-to-r from-red-900/20 to-green-900/20 border border-white/5 p-4 rounded-xl">
                                                        <p className="text-sm font-medium text-white">
                                                            "The magic you are looking for is in the work you're avoiding."
                                                        </p>
                                                        <p className="text-xs text-neutral-400 mt-1">- MTRIX Team</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-4 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                            <Sparkles className="w-5 h-5 text-gold" />
                                                            Make a Wish
                                                        </h3>
                                                        <span className="text-xs text-neutral-500">{email}</span>
                                                    </div>

                                                    <textarea
                                                        className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-gold/50 resize-none"
                                                        placeholder="What do you wish for this Christmas?"
                                                        value={wish}
                                                        onChange={(e) => setWish(e.target.value)}
                                                        maxLength={200}
                                                    />

                                                    {errorMessage && <p className="text-red-400 text-xs text-center">{errorMessage}</p>}

                                                    <div className="mt-auto">
                                                        <Button
                                                            onClick={handleWishSubmit}
                                                            disabled={status === 'sending' || !wish.trim()}
                                                            className="w-full bg-gradient-to-r from-red-600 to-green-600 hover:from-red-500 hover:to-green-500 text-white font-bold h-11 border-none"
                                                        >
                                                            {status === 'sending' ? 'Sending to North Pole...' : 'Grant Wish'}
                                                        </Button>
                                                        <button onClick={() => { setIsAuthenticated(false); setErrorMessage(''); }} className="w-full text-xs text-neutral-500 hover:text-white py-2 mt-2">
                                                            Not you? Change Email
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="see-wishes"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex-1 flex flex-col h-full overflow-hidden"
                                >
                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-widest opacity-70">
                                        <Users className="w-4 h-4" />
                                        Community Wishes
                                    </h3>
                                    <ScrollArea className="flex-1 -mr-4 pr-4">
                                        <div className="pb-4 columns-1 md:columns-3 lg:columns-4 gap-4 space-y-4">
                                            {wishesLoading ? (
                                                <div className="text-center text-neutral-500 text-sm py-8 col-span-full">Loading wishes...</div>
                                            ) : wishes.length === 0 ? (
                                                <div className="text-center text-neutral-500 text-sm py-8 col-span-full">No wishes yet. Be the first!</div>
                                            ) : (
                                                wishes.map((w, i) => {
                                                    // Festive nuances: Cycle through subtle border colors
                                                    const bColors = [
                                                        'border-red-500/20 hover:border-red-500/40 bg-red-950/10',
                                                        'border-green-500/20 hover:border-green-500/40 bg-green-950/10',
                                                        'border-gold/20 hover:border-gold/40 bg-yellow-950/10'
                                                    ];
                                                    const styleClass = bColors[i % 3];

                                                    return (
                                                        <div
                                                            key={w.id}
                                                            className={`break-inside-avoid mb-4 border p-4 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg backdrop-blur-sm group ${styleClass}`}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="text-[10px] text-neutral-500 font-mono opacity-50">
                                                                    #{w.id.slice(0, 4)}
                                                                </span>
                                                                {i % 3 === 0 && <Snowflake className="w-3 h-3 text-white/20" />}
                                                                {i % 3 === 1 && <Sparkles className="w-3 h-3 text-white/20" />}
                                                            </div>
                                                            <p className="text-neutral-200 text-sm mb-3 font-light leading-relaxed">
                                                                "{w.message}"
                                                            </p>
                                                            <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2">
                                                                <span className="text-xs font-medium text-white/70">
                                                                    {w.name && w.name !== w.email ? w.name : (w.email === email ? w.email : 'Anonymous')}
                                                                </span>
                                                                <span className="text-[10px] text-neutral-600">
                                                                    {new Date(w.created_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </ScrollArea>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Share Button */}
                <button
                    onClick={handleShare}
                    className="mt-8 mx-auto flex items-center justify-center gap-2 text-neutral-400 hover:text-gold transition-colors py-2 px-6 rounded-full border border-white/10 bg-black/40 backdrop-blur-md hover:bg-white/10 group"
                >
                    <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Share the Spirit
                </button>

            </div>

            <ChristmasAudio />

            {/* Admin Link */}
            {/* Admin Link */}
            <div className="absolute bottom-4 w-full flex gap-6 justify-center z-50">
                <a href="/auth" className="text-neutral-500 hover:text-white text-[10px] uppercase tracking-widest transition-colors">
                    Admin Access
                </a>
                <button
                    onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.reload();
                    }}
                    className="text-neutral-500 hover:text-red-500 text-[10px] uppercase tracking-widest transition-colors"
                >
                    Sign Out
                </button>
            </div>
        </div>

    );
};

export default ComingSoon;
