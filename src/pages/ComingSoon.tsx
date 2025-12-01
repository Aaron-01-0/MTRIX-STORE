import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Users, ArrowRight, Check, Sparkles } from 'lucide-react';
import { AnimatePresence, motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import GlowingLogo from '@/components/home/GlowingLogo';

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

const AccessCard = ({ email, count }: { email: string, count: number }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useTransform(y, [-100, 100], [10, -10]);
    const rotateY = useTransform(x, [-100, 100], [-10, 10]);

    function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set(event.clientX - centerX);
        y.set(event.clientY - centerY);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    return (
        <motion.div
            style={{
                perspective: 1000,
            }}
            className="w-full max-w-md mx-auto"
        >
            <motion.div
                style={{
                    rotateX: useSpring(rotateX),
                    rotateY: useSpring(rotateY),
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="relative bg-black/40 border border-gold/30 p-8 rounded-xl backdrop-blur-xl overflow-hidden group"
            >
                {/* Holographic Shine */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ transform: 'translateZ(1px)' }} />

                {/* Card Content */}
                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center border border-gold/50 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                        <Check className="w-8 h-8 text-gold" />
                    </div>

                    <div>
                        <h3 className="text-2xl font-black text-white tracking-widest uppercase mb-1">Access Granted</h3>
                        <p className="text-gold/60 text-xs tracking-[0.2em] uppercase">Official Launch</p>
                    </div>

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent my-4" />

                    <div className="space-y-1">
                        <p className="text-neutral-400 text-xs uppercase tracking-wider">Member ID</p>
                        <p className="text-white font-mono font-bold tracking-widest">{email.split('@')[0]}</p>
                    </div>

                    <div className="flex items-center gap-2 text-gold/80 bg-gold/5 px-4 py-1.5 rounded-full border border-gold/10 mt-2">
                        <Sparkles className="w-3 h-3" />
                        <span className="text-xs font-bold tracking-wider">PRIORITY STATUS: CONFIRMED</span>
                    </div>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold/30 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gold/30 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gold/30 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold/30 rounded-br-lg" />
            </motion.div>
        </motion.div>
    );
};

const ComingSoon = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    // Counter State
    // Randomize base count between 1420 and 1460 to look organic
    const [baseCount] = useState(() => 1420 + Math.floor(Math.random() * 41));
    const [realCount, setRealCount] = useState(0);
    const [fakeCount, setFakeCount] = useState(() => {
        const saved = localStorage.getItem('mtrix_fake_count');
        return saved ? parseInt(saved, 10) : 0;
    });

    const subscriberCount = baseCount + realCount + fakeCount;

    const [showIntro, setShowIntro] = useState(false);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    // Persist fake count
    useEffect(() => {
        localStorage.setItem('mtrix_fake_count', fakeCount.toString());
    }, [fakeCount]);

    // Fetch Real Subscriber Count
    useEffect(() => {
        const fetchCount = async () => {
            const { count, error } = await supabase
                .from('launch_subscribers' as any)
                .select('*', { count: 'exact', head: true });

            if (!error && count !== null) {
                setRealCount(count);
            }
        };
        fetchCount();

        // Real-time subscription
        const channel = supabase
            .channel('public:launch_subscribers')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'launch_subscribers' }, () => {
                setRealCount(prev => prev + 1);
            })
            .subscribe();

        // Fake "Live" Activity
        const fakeActivity = setInterval(() => {
            if (Math.random() > 0.4) { // Increased chance to 60%
                setFakeCount(prev => prev + 1);
            }
        }, 2000); // Faster interval: 2 seconds

        return () => {
            supabase.removeChannel(channel);
            clearInterval(fakeActivity);
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

            const { error: funcError } = await supabase.functions.invoke('subscribe-launch', {
                body: { email }
            });

            if (funcError) {
                console.error('Function Error:', funcError);
                // For now, we still show success to the user to not break the flow, 
                // but we log it. Or maybe we should show it?
                // Let's throw it to catch block if we want to show error state.
                throw funcError;
            }

            setStatus('success');
            // Don't clear email immediately so we can show it on the card
            setRealCount(prev => prev + 1);
        } catch (error) {
            console.error('Error:', error);
            setStatus('error');
            // Optional: Show a toast or alert with the specific error if needed
            alert("Failed to join: " + (error.message || "Unknown error"));
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-gold/30">
            {/* Intro Animation Removed */}

            {/* Premium Background */}
            <div className="absolute inset-0 bg-black">
                {/* Christmas Gradients */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-900/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px] animate-pulse delay-1000" />
                <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-gold/5 rounded-full blur-[100px] animate-pulse delay-500" />
            </div>

            {/* Glowing Logo Background */}
            <GlowingLogo className="absolute inset-0 z-0 opacity-80" fontSize={isMobile ? 100 : 250} />

            {/* Main Content - Centered */}
            <div className={`z-10 w-full max-w-4xl mx-auto px-4 flex flex-col items-center justify-center text-center relative transition-opacity duration-1000 ${showIntro ? 'opacity-0' : 'opacity-100'}`}>

                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-forwards w-full max-w-2xl">
                    <div className="relative group cursor-default pt-20">
                        {/* Title removed as it's in the background now */}
                        <p className="text-lg md:text-xl text-gold/80 tracking-[0.3em] uppercase font-medium">
                            Official Launch
                        </p>
                    </div>

                    <p className="text-neutral-400 text-lg max-w-md mx-auto leading-relaxed">
                        Redefining Minimalism. Premium Thrift Store. Secure your spot on the guest list for our exclusive holiday drop.
                    </p>

                    {/* Countdown */}
                    <div className="flex justify-center gap-6 md:gap-8">
                        {Object.entries(timeLeft).map(([unit, value]) => (
                            <div key={unit} className="flex flex-col items-center group">
                                <span className="text-3xl md:text-4xl font-bold text-white mb-1 font-mono group-hover:text-gold transition-colors duration-300">
                                    {String(value).padStart(2, '0')}
                                </span>
                                <span className="text-[10px] text-neutral-600 uppercase tracking-widest">{unit}</span>
                            </div>
                        ))}
                    </div>

                    {/* Scarcity Counter */}
                    <div className="max-w-md mx-auto bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm hover:border-gold/30 transition-colors duration-300">
                        <div className="flex justify-between items-end mb-2">
                            <div className="flex items-center gap-2 text-gold">
                                <Users className="w-4 h-4" />
                                <span className="font-bold text-sm uppercase tracking-wider">Spots Claimed</span>
                            </div>
                            <span className="font-mono text-white font-bold w-16 text-right inline-block">
                                {subscriberCount.toLocaleString()}
                            </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-2 text-right">
                            Join the waitlist
                        </p>
                    </div>

                    {/* Notify Form or Access Card */}
                    <div className="max-w-md mx-auto w-full">
                        <AnimatePresence mode="wait">
                            {(status === 'success' || user) ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <AccessCard email={user?.email || email} count={subscriberCount} />
                                </motion.div>
                            ) : (
                                <motion.form
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onSubmit={handleSubmit}
                                    className="relative"
                                >
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
                                        disabled={status === 'loading'}
                                        className="absolute right-1.5 top-1.5 bottom-1.5 bg-white text-black font-bold px-6 rounded-full hover:bg-gold hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
                                    >
                                        {status === 'loading' ? 'Processing...' : (
                                            <>
                                                Join <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>


                </div>
            </div>

            {/* Admin Access Link */}
            <div className="absolute bottom-8 text-center w-full">
                <a href="/auth" className="text-neutral-800 hover:text-neutral-600 text-xs uppercase tracking-widest transition-colors">
                    Admin Access
                </a>
            </div>
        </div>

    );
};

export default ComingSoon;
