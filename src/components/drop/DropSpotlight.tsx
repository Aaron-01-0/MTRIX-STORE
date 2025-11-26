import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import NotifyModal from "./NotifyModal";

const DropSpotlight = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <section className="py-24 bg-mtrix-black text-white overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">

                    {/* Product Image */}
                    <div className="w-full lg:w-1/2 relative group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-neon-cyan/20 to-electric-magenta/20 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
                        <img
                            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop"
                            alt="MTRIX Limited Edition Hoodie"
                            className="relative z-10 w-full h-auto object-cover rounded-lg transform group-hover:scale-105 transition-transform duration-700"
                        />
                        {/* Floating Badge */}
                        <div className="absolute top-4 right-4 z-20">
                            <Badge className="bg-electric-magenta text-white border-none px-4 py-2 text-lg font-orbitron tracking-wider animate-pulse">
                                ONLY 150 UNITS
                            </Badge>
                        </div>
                    </div>

                    {/* Product Details */}
                    <div className="w-full lg:w-1/2 space-y-8">
                        <div>
                            <h2 className="text-5xl md:text-7xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 mb-4">
                                CYBER HOODIE V1
                            </h2>
                            <p className="text-2xl text-neon-cyan font-bold tracking-widest mb-6">
                                $120.00 USD
                            </p>
                            <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                                Engineered for the digital nomad. Features heavyweight french terry cotton, reflective 3M detailing, and a hidden NFC chip for exclusive digital content access. This is not just clothing; it's hardware for your lifestyle.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 text-sm text-gray-500 font-mono">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-neon-cyan rounded-full animate-ping" />
                                    DROP OPENS IN 3 DAYS
                                </span>
                                <span>|</span>
                                <span>WORLDWIDE SHIPPING</span>
                            </div>

                            <Button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full md:w-auto bg-white text-black text-xl px-12 py-6 font-bold hover:bg-neon-cyan hover:text-black transition-all duration-300 skew-x-[-10deg]"
                            >
                                NOTIFY ME
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <NotifyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </section>
    );
};

export default DropSpotlight;
