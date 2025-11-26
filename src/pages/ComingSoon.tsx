import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

const ComingSoon = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const [showSecret, setShowSecret] = useState(false);
    const [password, setPassword] = useState('');

    // Target Date: Dec 25, 2024
    const targetDate = new Date('2024-12-25T00:00:00');

    function calculateTimeLeft() {
        const difference = +targetDate - +new Date();
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

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

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
        if (password === 'neo') { // Simple client-side check for now, or use real auth
            localStorage.setItem('mtrix_bypass', 'true');
            window.location.href = '/';
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-mono">
            {/* Matrix Rain Background (Simplified CSS/Canvas placeholder) */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(32, 255, 77, .3) 25%, rgba(32, 255, 77, .3) 26%, transparent 27%, transparent 74%, rgba(32, 255, 77, .3) 75%, rgba(32, 255, 77, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(32, 255, 77, .3) 25%, rgba(32, 255, 77, .3) 26%, transparent 27%, transparent 74%, rgba(32, 255, 77, .3) 75%, rgba(32, 255, 77, .3) 76%, transparent 77%, transparent)',
                backgroundSize: '50px 50px'
            }}></div>

            <div className="z-10 text-center px-4 max-w-2xl w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 animate-pulse">
                        MTRIX
                    </h1>
                    <p className="text-xl md:text-2xl text-green-500 mb-12 tracking-widest uppercase">
                        System Loading...
                    </p>
                </motion.div>

                {/* Countdown */}
                <div className="grid grid-cols-4 gap-4 mb-16">
                    {Object.entries(timeLeft).map(([unit, value]) => (
                        <div key={unit} className="flex flex-col items-center p-4 border border-green-900/50 bg-black/50 backdrop-blur-sm rounded-lg">
                            <span className="text-3xl md:text-5xl font-bold text-white mb-2">
                                {String(value).padStart(2, '0')}
                            </span>
                            <span className="text-xs text-green-500 uppercase tracking-wider">{unit}</span>
                        </div>
                    ))}
                </div>

                {/* Notify Form */}
                <div className="mb-12">
                    <p className="text-gray-400 mb-4">Join the resistance. Get notified when we breach.</p>
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="flex-1 bg-black border border-green-800 text-green-400 px-4 py-3 rounded focus:outline-none focus:border-green-500 transition-colors"
                            required
                        />
                        <button
                            type="submit"
                            disabled={status === 'loading' || status === 'success'}
                            className="bg-green-600 hover:bg-green-500 text-black font-bold px-6 py-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'loading' ? 'Hacking...' : status === 'success' ? 'Infiltrated' : 'Notify Me'}
                        </button>
                    </form>
                    {status === 'success' && (
                        <p className="text-green-400 mt-4 text-sm">You are in. Watch your inbox.</p>
                    )}
                </div>

                {/* Secret Access */}
                <div className="absolute bottom-8 left-0 right-0 text-center">
                    <button
                        onClick={() => setShowSecret(!showSecret)}
                        className="text-green-900/30 hover:text-green-900/50 text-xs transition-colors"
                    >
                        π
                    </button>
                </div>

                {showSecret && (
                    <div className="mt-4 flex justify-center gap-2">
                        <input
                            type="password"
                            placeholder="Passkey"
                            className="bg-black border border-green-900/30 text-green-900 px-2 py-1 text-xs rounded"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            onClick={handleSecretLogin}
                            className="bg-green-900/20 text-green-800 text-xs px-2 py-1 rounded hover:bg-green-900/40"
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
