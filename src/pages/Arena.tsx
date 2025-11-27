import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trophy, Swords, Sparkles } from 'lucide-react';

const Arena = () => {
    const navigate = useNavigate();
    const [isEntering, setIsEntering] = useState(false);

    const handleEnter = () => {
        setIsEntering(true);
        setTimeout(() => {
            navigate('/arena/lobby');
        }, 1500);
    };

    return (
        <div className="relative min-h-screen bg-black overflow-hidden flex items-center justify-center font-orbitron">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />

            {/* Animated Particles/Fog (Simulated with divs) */}
            <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-purple-900/5 to-transparent pointer-events-none"
            />

            <AnimatePresence>
                {!isEntering ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.5, filter: 'blur(10px)' }}
                        transition={{ duration: 0.8 }}
                        className="relative z-10 text-center px-4"
                    >
                        <motion.div
                            initial={{ y: -50 }}
                            animate={{ y: 0 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="mb-8"
                        >
                            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 tracking-tighter mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                MTRIX
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                                    ARENA
                                </span>
                            </h1>
                            <p className="text-xl text-gray-400 max-w-2xl mx-auto tracking-widest uppercase">
                                Create. Compete. Conquer.
                            </p>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button
                                onClick={handleEnter}
                                className="group relative px-12 py-8 text-2xl font-bold bg-transparent border-2 border-purple-500 text-white overflow-hidden transition-all hover:border-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
                            >
                                <div className="absolute inset-0 bg-purple-600/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <span className="relative flex items-center gap-4">
                                    ENTER ARENA <Swords className="w-8 h-8" />
                                </span>
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="mt-12 flex justify-center gap-8 text-sm text-gray-500"
                        >
                            <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                <span>Weekly Rewards</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-500" />
                                <span>Community Voting</span>
                            </div>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative z-20 flex flex-col items-center"
                    >
                        <div className="w-24 h-24 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <p className="mt-4 text-purple-400 text-xl tracking-widest animate-pulse">
                            INITIALIZING BATTLEGROUND...
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Arena;
