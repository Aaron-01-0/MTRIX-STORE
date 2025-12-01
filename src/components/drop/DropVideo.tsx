import { ResponsiveVideo } from '@/components/ResponsiveVideo';

const DropVideo = () => {
    return (
        <section className="relative h-[80vh] w-full bg-black overflow-hidden">
            {/* Video Overlay */}
            <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center">
                <h2 className="text-6xl md:text-9xl font-orbitron font-black text-white/10 tracking-tighter uppercase text-center px-4 mix-blend-overlay">
                    The Drop That Defines The Season
                </h2>
            </div>

            {/* Video Placeholder */}
            <div className="absolute inset-0 z-0">
                <ResponsiveVideo
                    type="youtube"
                    embedId="qC0vDKVPCrw"
                    className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-1000"
                    autoPlay
                    muted
                    loop
                    playsInline
                />
            </div>

            {/* Marquee Text at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-neon-cyan/90 py-2 z-20 overflow-hidden">
                <div className="animate-scroll-left whitespace-nowrap flex gap-8 text-black font-bold font-orbitron tracking-widest">
                    <span>LIMITED EDITION</span>
                    <span>•</span>
                    <span>NO RESTOCKS</span>
                    <span>•</span>
                    <span>PREMIUM QUALITY</span>
                    <span>•</span>
                    <span>MTRIX EXCLUSIVE</span>
                    <span>•</span>
                    <span>LIMITED EDITION</span>
                    <span>•</span>
                    <span>NO RESTOCKS</span>
                    <span>•</span>
                    <span>PREMIUM QUALITY</span>
                    <span>•</span>
                    <span>MTRIX EXCLUSIVE</span>
                </div>
            </div>
        </section>
    );
};

export default DropVideo;
