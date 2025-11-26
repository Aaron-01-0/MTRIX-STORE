import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

const DropSocialProof = () => {
    const testimonials = [
        {
            name: "ALEX K.",
            handle: "@alex_kicks",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
            text: "The quality is insane. Worth every penny. Fits perfectly oversized.",
        },
        {
            name: "SARAH J.",
            handle: "@sarah.style",
            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
            text: "Best drop of the year. The neon details pop like crazy under UV light.",
        },
        {
            name: "MIKE R.",
            handle: "@mike_drop",
            image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
            text: "Managed to cop one from the last drop. It's my daily driver now.",
        },
    ];

    return (
        <section className="py-24 bg-mtrix-black text-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <Badge className="bg-neon-cyan text-black font-bold mb-4 animate-pulse">
                        COMMUNITY
                    </Badge>
                    <h2 className="text-4xl md:text-6xl font-orbitron font-black text-white mb-4">
                        VERIFIED BUYERS
                    </h2>
                    <p className="text-gray-400 max-w-xl mx-auto">
                        Join the elite circle of MTRIX owners. Tag us to get featured.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((item, index) => (
                        <div
                            key={index}
                            className="bg-mtrix-dark border border-mtrix-gray p-6 rounded-lg hover:border-neon-cyan transition-colors duration-300 group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-mtrix-gray group-hover:border-neon-cyan transition-colors"
                                />
                                <div>
                                    <h4 className="font-bold font-orbitron text-white">{item.name}</h4>
                                    <p className="text-xs text-gray-500">{item.handle}</p>
                                </div>
                                <CheckCircle2 className="w-5 h-5 text-neon-cyan ml-auto" />
                            </div>
                            <p className="text-gray-300 italic">"{item.text}"</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default DropSocialProof;
