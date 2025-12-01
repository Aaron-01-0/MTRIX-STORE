import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, Gamepad2, Users, Rocket, Target, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRef } from 'react';

const About = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

    const timelineEvents = [
        {
            year: "The Beginning",
            title: "Just Gamers",
            description: "A year ago, I was “Noa” — just a kid who loved grinding Valorant after classes. One random day, I asked my school friend Shaurya (Demon) to hop into a match. We were just playing for fun, but destiny had a different plan.",
            icon: Gamepad2,
            color: "text-blue-400"
        },
        {
            year: "The Connection",
            title: "Building the Squad",
            description: "Through Valorant, we met amazing people. That’s where I met Priyanshu (Nox). We’d stay up all night on Discord, watching VCT matches and laughing like idiots. Slowly, our circle grew: Eve, Aimboii, Demon, Nox, and me.",
            icon: Users,
            color: "text-purple-400"
        },
        {
            year: "The Spark",
            title: "A Crazy Idea",
            description: "One night, I asked: “What if we build a store? A POD brand? Something where we don't have to spend our pocket money on skins?” That one conversation changed everything.",
            icon: Sparkles,
            color: "text-gold"
        },
        {
            year: "The Grind",
            title: "From Chaos to MTRIX",
            description: "We started meeting daily. Talking about life, family, and this crazy dream. Somewhere in the chaos… I found the name: MTRIX. Everyone loved it. It felt right. It felt like us.",
            icon: Target,
            color: "text-red-400"
        },
        {
            year: "Today",
            title: "Launch Day",
            description: "For one full year, we kept building quietly — learning, failing, restarting, improving. And today… the moment is finally here.",
            icon: Rocket,
            color: "text-green-400"
        }
    ];

    return (
        <div ref={containerRef} className="min-h-screen bg-black text-white font-sans selection:bg-gold/30 overflow-x-hidden relative">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-gold/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse delay-1000" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 mix-blend-difference">
                <Link to="/" className="inline-flex items-center text-gold/80 hover:text-gold transition-all group">
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-orbitron tracking-widest text-sm">BACK TO BASE</span>
                </Link>
            </nav>

            {/* Hero Section */}
            <section className="h-screen flex flex-col justify-center items-center relative z-10 px-6 overflow-hidden">
                <motion.div
                    style={{ y, opacity }}
                    className="text-center space-y-6 max-w-5xl"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    >
                        <h1 className="text-5xl md:text-8xl lg:text-9xl font-black font-orbitron leading-none tracking-tighter">
                            FROM <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse">RTX</span>
                            <br />
                            TO <span className="text-gold drop-shadow-[0_0_30px_rgba(255,215,0,0.3)]">MTRIX</span>
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-xl md:text-3xl text-neutral-400 font-light tracking-wide max-w-2xl mx-auto"
                    >
                        A journey from late-night gaming to building a legacy.
                    </motion.p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-neutral-500"
                >
                    <span className="text-xs tracking-[0.2em] uppercase">Scroll to explore</span>
                    <div className="w-[1px] h-12 bg-gradient-to-b from-gold/0 via-gold/50 to-gold/0" />
                </motion.div>
            </section>

            {/* Timeline Section */}
            <section className="relative z-10 py-20 md:py-32 container mx-auto px-6 max-w-6xl">
                <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent" />

                <div className="space-y-24 md:space-y-32">
                    {timelineEvents.map((event, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.7, delay: index * 0.1 }}
                            className={`relative flex flex-col md:flex-row gap-8 md:gap-0 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                        >
                            {/* Timeline Dot */}
                            <div className="absolute left-4 md:left-1/2 -translate-x-[5px] md:-translate-x-1/2 w-3 h-3 rounded-full bg-black border border-gold shadow-[0_0_10px_rgba(255,215,0,0.5)] z-20 mt-2 md:mt-0" />

                            {/* Content */}
                            <div className="md:w-1/2 pl-12 md:pl-0 md:px-16">
                                <div className={`flex flex-col ${index % 2 === 0 ? 'md:items-start md:text-left' : 'md:items-end md:text-right'}`}>
                                    <div className={`flex items-center gap-3 mb-4 ${event.color}`}>
                                        <event.icon className="w-6 h-6" />
                                        <span className="font-orbitron font-bold tracking-wider">{event.year}</span>
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                                        {event.title}
                                    </h3>
                                    <p className="text-lg text-neutral-400 leading-relaxed max-w-md">
                                        {event.description}
                                    </p>
                                </div>
                            </div>

                            {/* Empty space for the other side */}
                            <div className="md:w-1/2" />
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Team Section */}
            <section className="relative z-10 py-20 pb-32 container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-2xl md:text-4xl font-orbitron font-bold text-white mb-4">THE SQUAD</h2>
                    <div className="w-24 h-1 bg-gold mx-auto rounded-full" />
                </motion.div>

                <div className="flex flex-wrap justify-center gap-6 md:gap-10 max-w-4xl mx-auto">
                    {['Noa', 'Demon', 'Nox', 'Eve', 'Aimboii'].map((name, index) => (
                        <motion.div
                            key={name}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.1, textShadow: "0 0 20px rgba(255,215,0,0.5)" }}
                            className="relative group cursor-default"
                        >
                            <div className="absolute inset-0 bg-gold/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <span className="relative text-xl md:text-3xl font-mono text-neutral-400 group-hover:text-white transition-colors">
                                {name}
                            </span>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-24 text-center"
                >
                    <p className="text-gold/60 uppercase tracking-[0.3em] text-sm">
                        Built with passion in India 🇮🇳
                    </p>
                </motion.div>
            </section>
        </div>
    );
};

export default About;
