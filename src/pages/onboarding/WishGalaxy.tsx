import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Float, Stars as DreiStars } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Send, Check } from 'lucide-react';
import { useWishes } from '@/hooks/useWishes';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

function Stars(props: any) {
    const ref = useRef<any>();
    const [sphere] = useMemo(() => {
        // Generate random points in a sphere. Must be divisible by 3.
        const points = random.inSphere(new Float32Array(6000), { radius: 1.5 });
        return [points];
    }, []);

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta / 10;
            ref.current.rotation.y -= delta / 15;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color="#FFD700"
                    size={0.005}
                    sizeAttenuation={true}
                    depthWrite={false}
                />
            </Points>
        </group>
    );
}

interface WishGalaxyProps {
    onComplete: () => void;
}

const WishGalaxy = ({ onComplete }: WishGalaxyProps) => {
    const { user } = useAuth();
    const { submitWish } = useWishes();
    const { toast } = useToast();

    const [wish, setWish] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasWished, setHasWished] = useState(false);

    const handleWishSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!wish.trim()) return;

        setIsSubmitting(true);

        // Use user data or defaults
        const name = user?.user_metadata?.name || user?.user_metadata?.first_name || 'Traveler';
        const email = user?.email || 'anonymous@mtrix.store';

        const result = await submitWish(wish, name, email);

        if (result.error) {
            toast({
                title: "Transmission Failed",
                description: "The void rejected your wish. Try again.",
                variant: "destructive"
            });
            setIsSubmitting(false);
        } else {
            setHasWished(true);
            // Clean up
            setWish('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black">
            <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 1] }}>
                    <Stars />
                    <Float speed={2} rotationIntensity={1.5} floatIntensity={1.5}>
                        <DreiStars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    </Float>
                </Canvas>
            </div>

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-auto">
                <AnimatePresence mode="wait">
                    {!hasWished ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: -50 }}
                            transition={{ duration: 1 }}
                            className="text-center p-8 w-full max-w-lg"
                        >
                            <h1 className="text-5xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-br from-white via-mtrix-gold to-white drop-shadow-[0_0_30px_rgba(255,215,0,0.5)] mb-6">
                                MAKE A WISH
                            </h1>
                            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                                Cast your dream into the digital void. <br />
                                It will become a star in our galaxy.
                            </p>

                            <form onSubmit={handleWishSubmit} className="relative">
                                <Input
                                    value={wish}
                                    onChange={(e) => setWish(e.target.value)}
                                    placeholder="I wish for..."
                                    className="bg-white/5 border-mtrix-gold/30 text-white text-center h-16 text-xl focus:border-mtrix-gold focus:ring-1 focus:ring-mtrix-gold rounded-none backdrop-blur-md"
                                    maxLength={100}
                                    autoFocus
                                />
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !wish.trim()}
                                    className="absolute right-2 top-2 bottom-2 bg-mtrix-gold text-black font-bold hover:bg-white"
                                >
                                    {isSubmitting ? <span className="animate-spin">⏳</span> : <Send className="w-5 h-5" />}
                                </Button>
                            </form>

                            <div className="mt-8">
                                <Button
                                    variant="ghost"
                                    onClick={() => setHasWished(true)}
                                    className="text-gray-600 hover:text-white text-xs tracking-widest uppercase"
                                >
                                    Skip to Galaxy
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1 }}
                            className="text-center p-8"
                        >
                            <div className="mb-6 flex justify-center">
                                <div className="w-20 h-20 rounded-full bg-mtrix-gold/20 flex items-center justify-center border border-mtrix-gold shadow-[0_0_30px_rgba(255,215,0,0.4)]">
                                    <Check className="w-10 h-10 text-mtrix-gold" />
                                </div>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black font-orbitron text-white mb-6">
                                RECORDED
                            </h1>
                            <p className="text-gray-400 text-xl max-w-xl mx-auto leading-relaxed mb-12">
                                Your wish has joined the constellation.<br />
                                <span className="text-mtrix-gold">The universe is listening.</span>
                            </p>

                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <Button
                                    onClick={onComplete}
                                    className="bg-mtrix-gold hover:bg-yellow-400 text-black font-black font-orbitron text-xl px-12 py-8 rounded-none clip-path-polygon shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:shadow-[0_0_40px_rgba(255,215,0,0.6)] transition-all"
                                >
                                    CLAIM YOUR REWARD <ArrowRight className="ml-2 w-6 h-6" />
                                </Button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default WishGalaxy;
