import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import GlowingLogo from './GlowingLogo';

const SetupBuilder = () => {
    return (
        <section className="relative min-h-[80vh] bg-black overflow-hidden flex items-center justify-center py-20">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold/5 via-black to-black" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

            <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                {/* Text Content */}
                <div className="space-y-8 order-2 lg:order-1 select-none">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gold animate-fade-in">
                        <ShoppingBag className="w-4 h-4" />
                        <span className="text-sm font-medium tracking-wide">PREMIUM THRIFT STORE</span>
                    </div>

                    <h2 className="text-5xl md:text-7xl font-orbitron font-black text-white leading-tight">
                        REDEFINING <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-white to-gold animate-gradient-x">
                            MINIMALISM
                        </span>
                    </h2>

                    <p className="text-xl text-gray-400 max-w-xl font-light leading-relaxed">
                        Curated thrift finds and sustainable essentials. Elevate your style with our exclusive collection of pre-loved and premium accessories.
                    </p>

                    <div className="flex flex-wrap gap-4 pt-4">
                        <Link to="/catalog">
                            <Button className="bg-gradient-gold text-black hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] text-lg px-8 py-6 rounded-none skew-x-[-10deg] transition-all duration-300 hover:scale-105">
                                <span className="skew-x-[10deg] font-bold tracking-wider flex items-center gap-2">
                                    SHOP DROP <ArrowRight className="w-5 h-5" />
                                </span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Glowing Interactive Logo */}
                <div className="order-1 lg:order-2 flex flex-col justify-center items-center h-[400px] w-full">
                    <GlowingLogo />
                </div>

            </div>
        </section>
    );
};

export default SetupBuilder;
