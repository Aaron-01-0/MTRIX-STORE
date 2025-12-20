import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface PrologueProps {
    onComplete: () => void;
}

const slides = [
    {
        id: 1,
        chapter: "ORIGIN",
        title: "THE LOBBY",
        text: "A year ago, MTRIX didn’t exist. We were just students and gamers—grinding Valorant, unwinding on Discord, and laughing through the night. No grand plans. just vibes.",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop" // Gaming/Esports vibe
    },
    {
        id: 2,
        chapter: "ALLIANCE",
        title: "THE SQUAD",
        text: "One random game brought us together. Eve, Aimboii, Demon, Nox. Strangers became friends across cities. Different lives. Same energy.",
        image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2670&auto=format&fit=crop" // Connection/Team
    },
    {
        id: 3,
        chapter: "GENESIS",
        title: "THE SPARK",
        text: "One night, a joke: \"What if we start something?\" We wanted skins without burning pocket money. But that banter turned into a year-long obsession.",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" // Abstract Light/Spark
    },
    {
        id: 4,
        chapter: "IDENTITY",
        title: "THE BUILD",
        text: "Then it clicked: MTRIX. A mix of identity, chaos, and teamwork. Born from friendship, not strategy decks. We learned, failed, and grew together.",
        image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2670&auto=format&fit=crop" // Matrix code / Tech
    },
    {
        id: 5,
        chapter: "ARRIVAL",
        title: "READY",
        text: "This isn't just a brand. It's a journey from gaming lobbies to reality. This is MTRIX. And this is only the beginning.",
        image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2670&auto=format&fit=crop" // Event/Stage/Light
    }
];

const Prologue = ({ onComplete }: PrologueProps) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
            {/* Background Images with Crossfade */}
            <AnimatePresence mode="popLayout">
                {slides.map((slide, index) => (
                    index === currentSlide && (
                        <motion.div
                            key={slide.id}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 0.3, scale: 1 }} // Low opacity for text readability
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5 }}
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${slide.image})` }}
                        />
                    )
                ))}
            </AnimatePresence>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-black" />

            {/* Content */}
            <div className="relative z-10 max-w-4xl px-8 text-center flex flex-col items-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col items-center"
                    >
                        <div className="mb-6">
                            <span className="px-4 py-1.5 border border-mtrix-gold/30 rounded-full text-mtrix-gold text-xs tracking-[0.4em] font-orbitron bg-black/50 backdrop-blur-sm">
                                CHAPTER 0{currentSlide + 1} // {slides[currentSlide].chapter}
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black font-orbitron text-white mb-8 tracking-tighter drop-shadow-[0_0_30px_rgba(255,215,0,0.3)]">
                            {slides[currentSlide].title}
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-300 font-light leading-relaxed max-w-3xl mx-auto mb-16">
                            {slides[currentSlide].text}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex flex-col items-center gap-8 mt-auto">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={nextSlide}
                        className="group relative px-10 py-4 bg-transparent overflow-hidden"
                    >
                        <div className="absolute inset-0 w-full h-full border border-mtrix-gold/30 group-hover:border-mtrix-gold transition-colors duration-300" />
                        <div className="absolute inset-0 w-0 bg-mtrix-gold group-hover:w-full transition-all duration-300 opacity-10" />

                        <span className="relative flex items-center gap-4 text-white font-orbitron tracking-widest text-lg group-hover:text-mtrix-gold transition-colors">
                            {currentSlide === slides.length - 1 ? 'ENTER THE GALAXY' : 'CONTINUE'}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </span>
                    </motion.button>

                    {/* Progress Dots */}
                    <div className="flex gap-4">
                        {slides.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1 mr-1 transition-all duration-500 rounded-full ${idx === currentSlide ? 'w-16 bg-mtrix-gold shadow-[0_0_10px_#FFD700]' : 'w-2 bg-gray-800'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Prologue;
