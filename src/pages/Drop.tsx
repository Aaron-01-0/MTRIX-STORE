import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Sparkles } from "lucide-react";

const Drop = () => {
    return (
        <div className="min-h-screen bg-black text-white font-inter selection:bg-gold/30 flex flex-col">
            <Navbar />

            <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden pt-20">
                {/* Background Effects */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[100px] translate-y-1/2 pointer-events-none" />

                <div className="container mx-auto px-4 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Sparkles className="w-4 h-4 text-gold" />
                        <span className="text-xs font-medium tracking-widest uppercase text-gold">Limited Edition</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-orbitron font-bold text-white mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                        NEXT DROP <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-white to-gold animate-gradient">
                            COMING SOON
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                        We are curating an exclusive collection of rare finds.
                        Stay tuned for the reveal.
                    </p>

                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                        <div className="inline-block p-[1px] rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent">
                            <div className="px-8 py-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-sm text-gray-400">
                                Follow us on Instagram for updates
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Drop;
