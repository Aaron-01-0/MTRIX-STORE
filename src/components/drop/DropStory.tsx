const DropStory = () => {
    return (
        <section className="py-32 bg-mtrix-black relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-50" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-electric-magenta to-transparent opacity-50" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center space-y-12">
                    <h2 className="text-4xl md:text-6xl font-orbitron font-bold text-white leading-tight">
                        BORN IN THE <span className="text-neon-cyan">SHADOWS</span>.<br />
                        FORGED IN THE <span className="text-electric-magenta">NEON LIGHT</span>.
                    </h2>

                    <div className="space-y-6 text-lg md:text-xl text-gray-400 leading-relaxed font-light">
                        <p>
                            This collection isn't just about fabric and stitching. It's about the late nights, the grind, and the pulse of the city that never sleeps. We took inspiration from the brutalist architecture of the metropolis and the vibrant chaos of the digital realm.
                        </p>
                        <p>
                            Every piece in Drop 01 is designed to be a shield against the mundane. Premium materials meet functional aesthetics. Limited run. No restocks. Once it's gone, it's history.
                        </p>
                    </div>

                    <div className="pt-12">
                        <img
                            src="/lovable-uploads/e00511e7-3f91-41b2-bd14-1fffd263cfd2.png"
                            alt="MTRIX Signature"
                            className="h-24 mx-auto opacity-50 hover:opacity-100 transition-opacity duration-500"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                        <p className="text-sm text-gray-600 mt-4 tracking-[0.5em] uppercase">Est. 2024 • Tokyo / New York</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DropStory;
