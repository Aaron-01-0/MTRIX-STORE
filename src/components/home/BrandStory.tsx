import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const BrandStory = () => {
    return (
        <section className="relative min-h-[80vh] flex items-center bg-black overflow-hidden">
            {/* Background Video */}
            <div className="absolute inset-0 z-0">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover opacity-60"
                >
                    {/* To use your own video:
                        1. Create a 'videos' folder in 'public'
                        2. Upload your video there (e.g., background.mp4)
                        3. Change src below to: "/videos/background.mp4" 
                    */}
                    <source src="https://cdn.pixabay.com/video/2023/10/22/186175-877653483_large.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-3xl">
                    <span className="text-primary font-mono text-sm tracking-[0.2em] uppercase mb-4 block animate-fade-in">
                        The Origin
                    </span>
                    <h2 className="text-5xl md:text-7xl font-orbitron font-bold text-white leading-tight mb-8">
                        BORN FROM <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
                            THE CHAOS.
                        </span>
                    </h2>

                    <div className="space-y-6 text-xl text-gray-300 font-light leading-relaxed max-w-2xl border-l-2 border-primary/30 pl-8">
                        <p>
                            We didn't start MTRIX to be just another store. We started it because we were tired of "clean" and "minimal" meaning "boring".
                        </p>
                        <p>
                            Your setup is your sanctuary. It's where you create, destroy, and rebuild. It shouldn't look like a dentist's office. It should look like <span className="text-white font-medium">YOU</span>.
                        </p>
                    </div>

                    <div className="mt-12">
                        <Link to="/about">
                            <Button className="bg-white text-black hover:bg-primary hover:text-black text-lg px-8 py-6 rounded-none transition-all duration-300 group">
                                Read Our Full Story
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute bottom-0 right-0 p-12 hidden lg:block">
                <p className="text-[12rem] font-orbitron font-bold text-white/5 leading-none select-none">
                    ZEN
                </p>
            </div>
        </section>
    );
};

export default BrandStory;
