import { Zap, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

const features = [
    {
        icon: Zap,
        title: "NEXT-GEN DESIGN",
        description: "Aesthetics that define the future."
    },
    {
        icon: ShieldCheck,
        title: "PREMIUM BUILD",
        description: "Quality you can feel."
    },
    {
        icon: Truck,
        title: "FAST SHIPPING",
        description: "Global delivery at warp speed."
    },
    {
        icon: RefreshCw,
        title: "EASY RETURNS",
        description: "Hassle-free 30-day guarantee."
    }
];

const VisualFeatures = () => {
    return (
        <section className="py-24 bg-black relative overflow-hidden">
            {/* Animated Background Text */}
            <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 overflow-hidden opacity-5 pointer-events-none select-none">
                <div className="whitespace-nowrap animate-marquee text-[20vw] font-orbitron font-black text-white leading-none">
                    MTRIX ZEN MTRIX ZEN MTRIX ZEN
                </div>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-black border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-primary/50 transition-all duration-500">
                                <feature.icon className="w-7 h-7 text-white group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-xl font-orbitron font-bold text-white mb-3 group-hover:text-primary transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-muted-foreground group-hover:text-white/80 transition-colors">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default VisualFeatures;
