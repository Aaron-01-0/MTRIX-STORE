import { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import { Copy, ArrowRight, Loader2, Star } from 'lucide-react';

interface Prize {
    id: string;
    label: string;
    value: string;
    code: string;
    rarity: 'common' | 'rare' | 'legendary';
    color: string;
}

interface RewardWheelProps {
    onComplete: () => void;
}

const RewardWheel = ({ onComplete }: RewardWheelProps) => {
    const { toast } = useToast();
    const [isSpinning, setIsSpinning] = useState(false);
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [winner, setWinner] = useState<Prize | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const controls = useAnimation();

    // Config for the reel
    const CARD_WIDTH = 220;
    const CARD_GAP = 16;
    const VISIBLE_CARDS = 5; // How many onscreen?

    // Fetch coupons
    useEffect(() => {
        const fetchCoupons = async () => {
            const { data } = await supabase.from('coupons').select('*').eq('is_active', true).limit(10);

            let basePrizes: Prize[] = [];

            if (data && data.length > 0) {
                basePrizes = data.map((c) => ({
                    id: c.id,
                    label: c.description || 'Reward',
                    value: c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`,
                    code: c.code,
                    rarity: c.discount_value > 20 ? 'legendary' : c.discount_value > 10 ? 'rare' : 'common',
                    color: c.discount_value > 20 ? '#FFD700' : c.discount_value > 10 ? '#9333ea' : '#333'
                }));
            } else {
                basePrizes = [
                    { id: '1', label: 'Welcome Gift', value: '5% OFF', code: 'WELCOME5', rarity: 'common', color: '#333' },
                    { id: '2', label: 'Starter Pack', value: 'Free Shipping', code: 'FREESHIP', rarity: 'rare', color: '#9333ea' },
                    { id: '3', label: 'Lucky Day', value: '10% OFF', code: 'LUCKY10', rarity: 'rare', color: '#9333ea' },
                    { id: '4', label: 'Jackpot', value: '20% OFF', code: 'JACKPOT20', rarity: 'legendary', color: '#FFD700' },
                ];
            }

            setPrizes(basePrizes);
        };
        fetchCoupons();
    }, []);

    // Generate the "Reel" strip
    // We need a long list of items to simulate scrolling. 
    // We will repeat the base prizes many times.
    const REEL_REPEAT = 30; // 30 sets of prizes
    const reelItems = Array(REEL_REPEAT).fill(prizes).flat();

    const spinWheel = async () => {
        if (isSpinning || prizes.length === 0) return;
        setIsSpinning(true);

        // 1. Determine Winner (Random Logic)
        // We want the winner to be somewhere deep in the reel (e.g., near the end)
        // to allow for a long spin duration.
        const winnerIndexInBase = Math.floor(Math.random() * prizes.length);
        const winningPrize = prizes[winnerIndexInBase];

        // We target a position around 70-80% into the strip
        const targetSetIndex = REEL_REPEAT - 5;
        const winningItemIndex = (targetSetIndex * prizes.length) + winnerIndexInBase;

        // Calculate Pixel Offset
        // We want the WINNING ITEM to be centered.
        // Center of Screen = window.innerWidth / 2
        // Item Center = (Index * (Width + Gap)) + (Width / 2)
        // We translate the container LEFT by (Item Center - Screen Center)

        // Assuming the container is centered in a wrapper of known width (e.g. 100vw).
        // Let's use a fixed container width reference for calculation or dynamic.
        // Simplified: Translate X = - (Index * (CARD_WIDTH + CARD_GAP)) + CenteringOffset

        // Random slight offset for "analog" feel (landing slightly off center but snapping? No, simple center)
        const itemWidth = CARD_WIDTH + CARD_GAP;
        const totalDistance = winningItemIndex * itemWidth;

        // Add random variation to land "near" the center? 
        // For now, precision landing.
        // We need to account for the viewport center. 
        // Let's say viewport is 100vw. We want winning card center at 50vw.
        // x = - (winningItemIndex * itemWidth) + (window.innerWidth / 2) - (CARD_WIDTH / 2)

        const centerOffset = (window.innerWidth / 2) - (CARD_WIDTH / 2);
        const targetX = -(totalDistance) + centerOffset;

        await controls.start({
            x: targetX,
            transition: {
                duration: 6,
                ease: [0.1, 1, 0.2, 1], // Cubic bezier for "Fast start, slow stop"
            }
        });

        // Create Expiry Date (7 Days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Save to Database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { error } = await supabase.from('user_rewards').insert({
                user_id: user.id,
                coupon_id: winningPrize.id, // Assuming prize.id IS coupon.id
                code: winningPrize.code,
                expires_at: expiresAt.toISOString()
            });
            if (error) console.error("Failed to save reward:", error);
        }

        // Animation Complete
        setWinner(winningPrize);
        setShowDialog(true);
        confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFFFFF', '#9333ea']
        });

        // setIsSpinning(false); // Keep disabled
    };

    const copyCode = () => {
        if (winner) {
            navigator.clipboard.writeText(winner.code);
            toast({ title: "Code Copied!", description: "Use it at checkout." });
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605218427306-635ba2439af2?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-10 blur-sm" />

            <div className="z-10 text-center mb-12">
                <h1 className="text-5xl md:text-7xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-mtrix-gold via-white to-mtrix-gold drop-shadow-[0_0_30px_rgba(255,215,0,0.5)] italic tracking-tighter">
                    HORIZON SPIN
                </h1>
                <p className="text-gray-400 mt-4 text-lg font-light tracking-wide uppercase">Press the button to initiate roll</p>
            </div>

            {/* THE REEL CONTAINER */}
            <div className="w-full relative h-[300px] flex items-center mb-12 overflow-hidden bg-black/50 border-y border-white/10 backdrop-blur-sm">

                {/* Center Indicator / Selection Box */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[260px] z-30 pointer-events-none">
                    {/* Glowing Frame */}
                    <div className="absolute inset-0 border-4 border-mtrix-gold rounded-xl shadow-[0_0_50px_rgba(255,215,0,0.6)] animate-pulse" />
                    {/* Triangles */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[20px] border-t-mtrix-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[20px] border-b-mtrix-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
                </div>

                {/* Moving Track */}
                <motion.div
                    className="flex gap-4 pl-[50vw]" // Start padded so first item is center-ish
                    animate={controls}
                    initial={{ x: 0 }}
                >
                    {reelItems.map((prize, i) => (
                        <div
                            key={`${prize.id}-${i}`}
                            className="relative shrink-0 w-[220px] h-[220px] rounded-lg p-1 bg-gradient-to-br from-gray-800 to-black overflow-hidden group"
                            style={{
                                boxShadow: `0 0 20px ${prize.color}40`,
                                borderColor: prize.color,
                                borderWidth: '1px'
                            }}
                        >
                            {/* Rarity Stripe */}
                            <div className="absolute inset-x-0 top-0 h-2" style={{ background: prize.color }} />

                            {/* Card Content */}
                            <div className="h-full w-full bg-black/80 flex flex-col items-center justify-center p-4 text-center rounded-md relative z-10">
                                <span className="text-xs font-bold tracking-widest uppercase mb-2 text-gray-500">
                                    {prize.rarity}
                                </span>
                                <div className="text-3xl font-black italic text-white mb-2 font-orbitron">
                                    {prize.value}
                                </div>
                                <div className="text-sm text-gray-400 truncate w-full" style={{ color: prize.color }}>
                                    {prize.label}
                                </div>
                            </div>

                            {/* Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                </motion.div>

                {/* Gradient Fades on Sides */}
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-20" />
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-20" />
            </div>

            <Button
                onClick={spinWheel}
                disabled={isSpinning || prizes.length === 0}
                className="z-10 w-72 h-20 text-2xl font-black font-orbitron bg-mtrix-gold hover:bg-yellow-400 text-black shadow-[0_0_40px_rgba(255,215,0,0.3)] transition-all transform hover:scale-105 skew-x-[-10deg]"
            >
                {isSpinning ? (
                    <div className="flex items-center unskew-x-[10deg]">
                        <Loader2 className="animate-spin w-8 h-8 mr-3" /> ROLLING...
                    </div>
                ) : (
                    <span className="skew-x-[10deg]">SPIN FOR REWARD</span>
                )}
            </Button>

            {/* Winner Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="bg-mtrix-black border-mtrix-gold/50 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-4xl font-black text-center text-mtrix-gold font-orbitron italic">
                            REWARD UNLOCKED
                        </DialogTitle>
                    </DialogHeader>

                    {winner && (
                        <div className="py-8 text-center space-y-6">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-full h-32 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black rounded-lg border-2 border-dashed border-mtrix-gold/30"
                            >
                                <div className="text-center">
                                    <h3 className="text-5xl font-black text-white drop-shadow-lg font-orbitron">{winner.value}</h3>
                                    <p className="text-mtrix-gold mt-2 font-medium tracking-wide">{winner.label}</p>
                                </div>
                            </motion.div>

                            <div className="bg-white/5 p-4 rounded-lg flex items-center justify-between border border-white/10 group hover:border-mtrix-gold/50 transition-colors cursor-pointer" onClick={copyCode}>
                                <code className="text-2xl font-mono text-mtrix-gold font-bold tracking-wider">{winner.code}</code>
                                <Button size="icon" variant="ghost" className="text-gray-400 group-hover:text-white">
                                    <Copy className="w-5 h-5" />
                                </Button>
                            </div>
                            <p className="text-xs text-center text-gray-500 uppercase tracking-widest">Auto-applied at checkout</p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            className="w-full bg-mtrix-gold text-black font-bold h-12 text-lg font-orbitron"
                            onClick={() => {
                                setShowDialog(false);
                                onComplete(); // Go to Store
                            }}
                        >
                            CLAIM & ENTER <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RewardWheel;
