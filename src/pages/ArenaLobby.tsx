import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { ArenaDesign, VotingPeriod } from '@/types/arena';
import DesignCard from '@/components/arena/DesignCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Flame, Clock, Trophy } from 'lucide-react';

const ArenaLobby = () => {
    const [designs, setDesigns] = useState<ArenaDesign[]>([]);
    const [loading, setLoading] = useState(true);
    const [activePeriod, setActivePeriod] = useState<VotingPeriod | null>(null);
    const [filter, setFilter] = useState('trending'); // trending, new, top

    useEffect(() => {
        fetchActivePeriod();
        fetchDesigns();
    }, [filter]);

    const fetchActivePeriod = async () => {
        const { data } = await supabase
            .from('voting_periods')
            .select('*')
            .eq('status', 'active')
            .maybeSingle();

        if (data) setActivePeriod(data as VotingPeriod);
    };

    const fetchDesigns = async () => {
        setLoading(true);
        let query = supabase
            .from('arena_designs')
            .select(`
        *,
        profiles:user_id (username, avatar_url)
      `)
            .eq('status', 'voting');

        // Apply filters
        if (filter === 'trending') {
            // For now, trending = most votes (can be more complex later)
            query = query.order('votes_count', { ascending: false });
        } else if (filter === 'new') {
            query = query.order('created_at', { ascending: false });
        } else if (filter === 'top') {
            query = query.order('votes_count', { ascending: false });
        }

        const { data, error } = await query;
        if (error) console.error('Error fetching designs:', error);
        else setDesigns((data as any[]) || []);

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-black text-white font-inter selection:bg-purple-500/30">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-black font-orbitron tracking-tighter mb-6">
                            BATTLE FOR <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">GLORY</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
                            Vote for the next generation of MTRIX gear. The winners get produced. The creators get paid.
                        </p>

                        {activePeriod && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 mb-8">
                                <Clock className="w-4 h-4" />
                                <span className="font-orbitron tracking-wide text-sm">
                                    VOTING ENDS IN: <span className="text-white font-bold">2D 14H 32M</span>
                                </span>
                            </div>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* Filters & Search */}
            <section className="sticky top-20 z-40 bg-black/80 backdrop-blur-md border-y border-white/10 py-4">
                <div className="container mx-auto px-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
                        {[
                            { id: 'trending', label: 'Trending', icon: Flame },
                            { id: 'new', label: 'Fresh Drops', icon: Clock },
                            { id: 'top', label: 'Top Rated', icon: Trophy },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setFilter(item.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filter === item.id
                                        ? 'bg-white text-black'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                            placeholder="Search designs..."
                            className="bg-white/5 border-white/10 pl-10 focus:border-purple-500/50"
                        />
                    </div>
                </div>
            </section>

            {/* Design Grid */}
            <section className="container mx-auto px-4 py-12">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="aspect-[4/5] bg-white/5 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : designs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {designs.map((design) => (
                            <DesignCard key={design.id} design={design} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Filter className="w-8 h-8 text-gray-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No Designs Found</h3>
                        <p className="text-gray-500">Be the first to submit a design for this period!</p>
                        <Button className="mt-6 bg-white text-black hover:bg-gray-200">
                            Submit Design
                        </Button>
                    </div>
                )}
            </section>

            <Footer />
        </div>
    );
};

export default ArenaLobby;
