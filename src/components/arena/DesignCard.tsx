import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Eye, Share2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ArenaDesign } from '@/types/arena';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface DesignCardProps {
    design: ArenaDesign;
    onVote?: (newCount: number) => void;
}

const DesignCard = ({ design, onVote }: DesignCardProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [votes, setVotes] = useState(design.votes_count);
    const [hasVoted, setHasVoted] = useState(design.has_voted || false);
    const [isVoting, setIsVoting] = useState(false);

    const handleVote = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            toast({ title: "Login Required", description: "You must be logged in to vote.", variant: "destructive" });
            return;
        }
        if (hasVoted) return;

        setIsVoting(true);

        // Optimistic Update
        setVotes(prev => prev + 1);
        setHasVoted(true);

        try {
            const { error } = await supabase
                .from('arena_votes')
                .insert({
                    design_id: design.id,
                    voting_period_id: design.voting_period_id!,
                    user_id: user.id
                });

            if (error) {
                if (error.code === '23505') { // Unique violation
                    toast({ title: "Already Voted", description: "You have already voted for this design.", variant: "destructive" });
                } else {
                    throw error;
                }
                // Revert
                setVotes(prev => prev - 1);
                setHasVoted(false);
            } else {
                if (onVote) onVote(votes + 1);
                toast({ title: "Vote Cast!", description: "You voted for " + design.title });
            }
        } catch (error) {
            console.error('Vote error:', error);
            toast({ title: "Error", description: "Failed to cast vote.", variant: "destructive" });
            // Revert
            setVotes(prev => prev - 1);
            setHasVoted(false);
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="group relative bg-black/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm hover:border-purple-500/50 transition-colors"
        >
            {/* Image */}
            <div className="aspect-[4/5] relative overflow-hidden">
                <OptimizedImage
                    src={design.image_url}
                    alt={design.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                {/* Overlay Actions */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-10 group-hover:translate-x-0 transition-transform duration-300">
                    <Button size="icon" variant="secondary" className="h-8 w-8 bg-black/50 backdrop-blur-md hover:bg-white hover:text-black">
                        <Share2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8 bg-black/50 backdrop-blur-md hover:bg-red-500 hover:text-white">
                        <AlertTriangle className="w-4 h-4" />
                    </Button>
                </div>

                {/* Vote Button (Overlay) */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <Button
                        onClick={handleVote}
                        disabled={hasVoted || isVoting}
                        className={`w-full font-orbitron font-bold tracking-wider ${hasVoted
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                            }`}
                    >
                        {hasVoted ? 'VOTED' : 'VOTE NOW'}
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-orbitron font-bold text-white truncate pr-2">{design.title}</h3>
                        <p className="text-xs text-gray-400">by @{design.profiles?.name || 'Anonymous'}</p>
                    </div>
                    <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10">
                        {design.category || 'Art'}
                    </Badge>
                </div>

                <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-white">
                            <Heart className={`w-4 h-4 ${hasVoted ? 'fill-purple-500 text-purple-500' : ''}`} />
                            <span className="font-bold">{votes}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Eye className="w-4 h-4" />
                            <span>{design.views_count}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default DesignCard;
