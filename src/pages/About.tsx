import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-gold/30 overflow-x-hidden">
            <div className="container mx-auto px-6 py-12 md:py-20 max-w-4xl relative z-10">
                <Link to="/" className="inline-flex items-center text-gold/60 hover:text-gold mb-12 transition-colors group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-12"
                >
                    <header className="space-y-4">
                        <h1 className="text-4xl md:text-6xl font-black font-orbitron leading-tight">
                            FROM <span className="text-gold">RTX</span> TO <span className="text-white">MTRIX</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-neutral-400 font-light tracking-wide">
                            A Year-Long Journey From Gamers to Entrepreneurs
                        </p>
                    </header>

                    <div className="space-y-8 text-lg md:text-xl leading-relaxed text-neutral-300">
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            A year ago, I was “Noa” — just a kid who loved grinding Valorant after classes.
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                        >
                            One random day, I asked my school friend Shaurya (Demon) to hop into a match.
                            We were just playing for fun, but destiny had a different plan.
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                        >
                            Through Valorant, we met a lot of amazing people. Supportive, funny, and genuinely good friends.
                            That’s where I met Priyanshu (Nox) — the guy who’d later become my late-night VCT-watching partner.
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 }}
                        >
                            We’d stay up the whole night on Discord, watching matches and laughing like idiots.
                            Slowly, our little circle grew:
                            Eve, Aimboii, Demon, Nox, and me — all from different corners of India.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.6 }}
                            className="pl-6 border-l-2 border-gold/30 italic text-gold/80 my-8"
                        >
                            <p>Different cities.</p>
                            <p>Different backgrounds.</p>
                            <p>But one shared passion: creating something of our own.</p>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.7 }}
                        >
                            One night, I brought up a random idea —
                            <br />
                            <span className="text-white font-medium block mt-2 text-2xl">“What if we build a store? A POD brand? Something where we don't have to spend our pocket money on skins?”</span>
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.8 }}
                        >
                            That one conversation changed everything.
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.9 }}
                        >
                            We started meeting daily.
                            Talking about life, family, and this crazy dream.
                            And somewhere in the chaos… I found the name:
                        </motion.p>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 100, delay: 1.0 }}
                            className="py-12 flex justify-center"
                        >
                            <h2 className="text-6xl md:text-9xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-800 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                MTRIX.
                            </h2>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 1.1 }}
                        >
                            Everyone loved it. It felt right. It felt like us.
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 1.2 }}
                        >
                            For one full year, we kept building quietly — learning, failing, restarting, improving.
                            And today… the moment is finally here.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1.4 }}
                        className="pt-12 border-t border-white/10"
                    >
                        <p className="text-center text-gold/60 uppercase tracking-widest text-sm mb-6">
                            With gratitude
                        </p>
                        <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-neutral-400 font-mono text-sm md:text-base">
                            {['Noa', 'Demon', 'Nox', 'Eve', 'Aimboii'].map((name, index) => (
                                <motion.span
                                    key={name}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.5 + index * 0.1 }}
                                    className="hover:text-gold transition-colors cursor-default"
                                >
                                    {name}
                                </motion.span>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Background Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-gold/5 rounded-full blur-[100px] transform-gpu will-change-transform" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[100px] transform-gpu will-change-transform" />
                {/* Replaced external SVG with simple texture or removed for performance */}
                <div className="absolute inset-0 bg-white/5 opacity-10 mix-blend-overlay" />
            </div>
        </div>
    );
};

export default About;
