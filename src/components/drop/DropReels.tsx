const DropReels = () => {
    return (
        <section className="py-24 bg-black text-white overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                    <div>
                        <h2 className="text-5xl md:text-7xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-electric-magenta to-neon-cyan">
                            BEHIND THE DROP
                        </h2>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-gray-400 font-mono">FOLLOW US @MTRIX_OFFICIAL</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="relative aspect-[9/16] group cursor-pointer">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10" />

                            {/* Neon Border Effect */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan to-electric-magenta rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-500" />

                            <div className="relative h-full bg-mtrix-dark rounded-lg overflow-hidden border border-mtrix-gray group-hover:border-transparent transition-colors">
                                <img
                                    src={`https://images.unsplash.com/photo-16173865644${item}8-5d7d37561551?q=80&w=600&auto=format&fit=crop`}
                                    alt={`Reel ${item}`}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                />

                                <div className="absolute bottom-6 left-6 z-20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                                        </div>
                                        <span className="text-sm font-bold">Watch Reel</span>
                                    </div>
                                    <p className="text-xs text-gray-400">15.4K Views</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default DropReels;
