import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import NotifyModal from "./NotifyModal";

const DropHero = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        // Set drop date to 3 days from now for demo purposes
        const dropDate = new Date();
        dropDate.setDate(dropDate.getDate() + 3);

        const interval = setInterval(() => {
            const now = new Date();
            const difference = dropDate.getTime() - now.getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            } else {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=2070&auto=format&fit=crop"
                    alt="Urban Streetwear Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-mtrix-black" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 text-center flex flex-col items-center">
                <div className="animate-fade-in space-y-2 mb-8">
                    <span className="inline-block px-4 py-1 border border-neon-cyan text-neon-cyan text-sm font-bold tracking-widest uppercase bg-black/50 backdrop-blur-sm">
                        Limited Release • 150 Units
                    </span>
                </div>

                <h1 className="text-6xl md:text-8xl lg:text-9xl font-orbitron font-black text-white tracking-tighter mb-4 animate-slide-up drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">
                    MTRIX <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-electric-magenta">DROP 01</span>
                </h1>

                <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-12 font-light tracking-wide animate-slide-up [animation-delay:200ms]">
                    The future of streetwear is here. Don't miss the drop that defines the season.
                </p>

                {/* Countdown Timer */}
                <div className="grid grid-cols-4 gap-4 md:gap-8 mb-12 animate-slide-up [animation-delay:400ms]">
                    {[
                        { label: "DAYS", value: timeLeft.days },
                        { label: "HOURS", value: timeLeft.hours },
                        { label: "MINS", value: timeLeft.minutes },
                        { label: "SECS", value: timeLeft.seconds },
                    ].map((item, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <div className="text-4xl md:text-6xl font-black text-white font-orbitron bg-black/30 backdrop-blur-md border border-white/10 rounded-lg p-4 min-w-[80px] md:min-w-[120px]">
                                {String(item.value).padStart(2, "0")}
                            </div>
                            <span className="text-xs md:text-sm text-neon-cyan mt-2 font-bold tracking-widest">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>

                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-electric-magenta text-white text-lg px-12 py-8 rounded-none font-bold tracking-wider hover:bg-electric-magenta/80 hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(255,0,255,0.4)] animate-slide-up [animation-delay:600ms] clip-path-polygon"
                    style={{ clipPath: "polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)" }}
                >
                    NOTIFY ME BEFORE DROP
                </Button>
            </div>

            <NotifyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </section>
    );
};

export default DropHero;
