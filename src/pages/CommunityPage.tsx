import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import UploadPostDialog from '@/components/community/UploadPostDialog';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Post {
    id: string;
    image_url: string;
    caption: string | null;
    likes_count: number;
    is_featured: boolean;
    user_id: string;
    created_at: string;
    has_liked?: boolean;
    user_reaction?: string;
    profiles?: {
        name: string | null;
        avatar_url: string | null;
    } | null;
}

const REACTION_EMOJIS = [
    { label: 'Like', icon: '👍', value: 'like' },
    { label: 'Fire', icon: '🔥', value: 'fire' },
    { label: 'Skull', icon: '💀', value: 'skull' },
    { label: 'Cry', icon: '😭', value: 'cry' },
    { label: 'Clown', icon: '🤡', value: 'clown' },
    { label: 'Stone', icon: '🗿', value: 'stone' },
    { label: 'Cap', icon: '🧢', value: 'cap' },
];

const CommunityPage = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        fetchPosts();
    }, [user]);

    const fetchPosts = async () => {
        try {
            setLoading(true);

            // Fetch approved posts with user profiles
            const { data: postsData, error: postsError } = await supabase
                .from('community_posts')
                .select(`
                    *,
                    reaction_count,
                    profiles (name, avatar_url)
                `)
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (postsError) throw postsError;

            // Parse reaction_count (handle bigint string) and map to likes_count
            let postsWithLikes = (postsData || []).map(p => ({
                ...p,
                likes_count: p.reaction_count ? (typeof p.reaction_count === 'string' ? parseInt(p.reaction_count) : p.reaction_count) : (p.likes_count || 0)
            })) as unknown as Post[];

            // If user is logged in, check which posts they liked and their reaction
            if (user && postsData.length > 0) {
                const { data: likesData } = await supabase
                    .from('post_likes')
                    .select('post_id, reaction_type' as any)
                    .eq('user_id', user.id)
                    .in('post_id', postsData.map(p => p.id));

                const likedMap = new Map((likesData as any[])?.map(l => [l.post_id, l.reaction_type || 'like']));

                postsWithLikes = postsWithLikes.map(p => ({
                    ...p,
                    has_liked: likedMap.has(p.id),
                    user_reaction: likedMap.get(p.id)
                }));
            }

            setPosts(postsWithLikes);
        } catch (error) {
            console.error('Error fetching community posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReaction = async (postId: string, reactionType: string) => {
        if (!user) {
            toast({
                title: "Sign in required",
                description: "Please sign in to react to posts",
                variant: "destructive"
            });
            return;
        }

        const post = posts.find(p => p.id === postId);
        if (!post) return;

        const isSameReaction = post.user_reaction === reactionType;
        const isRemoving = isSameReaction; // Toggle off if clicking same reaction

        // Optimistic update
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    has_liked: !isRemoving,
                    user_reaction: isRemoving ? undefined : reactionType,
                    likes_count: isRemoving ? Math.max(0, p.likes_count - 1) : (post.has_liked ? p.likes_count : p.likes_count + 1)
                };
            }
            return p;
        }));

        try {
            const { data, error } = await supabase.rpc('toggle_post_reaction', {
                p_post_id: postId,
                p_reaction_type: reactionType
            });

            if (error) throw error;

            // Optional: Sync with server response if needed
            // if (data) {
            //     setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: data.likes_count } : p));
            // }

        } catch (error) {
            console.error('Error toggling reaction:', error);
            toast({
                title: "Error",
                description: "Failed to update reaction. Please try again.",
                variant: "destructive"
            });
            fetchPosts(); // Revert on error
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-primary">
            <Navbar />

            <main className="pt-24 pb-20">
                {/* Hero Section */}
                <section className="relative py-20 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                    <div className="container mx-auto px-4 text-center relative z-10">
                        <h1 className="text-5xl md:text-7xl font-orbitron font-bold mb-6 tracking-wider">
                            MTRIX <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">COMMUNITY</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 font-light">
                            Join the movement. Share your style. Get featured.
                        </p>
                        <UploadPostDialog onSuccess={fetchPosts} />
                    </div>
                </section>

                {/* Feed Grid */}
                <section className="container mx-auto px-4">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-20 border border-white/10 rounded-2xl bg-white/5">
                            <p className="text-gray-400 mb-4">No posts yet. Be the first to share!</p>
                            <UploadPostDialog onSuccess={fetchPosts} />
                        </div>
                    ) : (
                        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                            {posts.map((post) => (
                                <div key={post.id} className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-zinc-900/50 border border-white/5 hover:border-primary/30 transition-all duration-300">
                                    <div className="relative aspect-[3/4] md:aspect-auto">
                                        <img
                                            src={post.image_url}
                                            alt={post.caption || 'Community post'}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">

                                            {/* User Info */}
                                            <div className="flex items-center gap-3 mb-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-white/10">
                                                    {post.profiles?.avatar_url ? (
                                                        <img src={post.profiles.avatar_url} alt={post.profiles.name || 'User'} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                                                            {post.profiles?.name?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium text-white shadow-black drop-shadow-md">
                                                    {post.profiles?.name || 'Anonymous'}
                                                </span>
                                            </div>

                                            {post.caption && (
                                                <p className="text-gray-200 text-sm mb-4 line-clamp-2 font-light translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                                                    {post.caption}
                                                </p>
                                            )}

                                            <div className="flex items-center justify-between translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">
                                                <div className="flex items-center gap-2 relative group/reaction">
                                                    {/* Reaction Button */}
                                                    <div className="relative">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className={cn(
                                                                "rounded-full hover:bg-white/20 transition-colors relative z-10",
                                                                post.has_liked ? "text-red-500 hover:text-red-600" : "text-white"
                                                            )}
                                                            onClick={() => handleReaction(post.id, post.user_reaction || 'like')}
                                                        >
                                                            {post.user_reaction && post.user_reaction !== 'like' ? (
                                                                <span className="text-xl">{REACTION_EMOJIS.find(e => e.value === post.user_reaction)?.icon}</span>
                                                            ) : (
                                                                <Heart className={cn("w-6 h-6", post.has_liked && "fill-current")} />
                                                            )}
                                                        </Button>

                                                        {/* Reaction Picker Popup */}
                                                        <div className="absolute bottom-full left-0 mb-2 p-1.5 bg-black/90 backdrop-blur-xl border border-white/10 rounded-full flex gap-1 shadow-xl opacity-0 invisible group-hover/reaction:opacity-100 group-hover/reaction:visible transition-all duration-300 scale-90 group-hover/reaction:scale-100 origin-bottom-left z-50">
                                                            {REACTION_EMOJIS.map((emoji) => (
                                                                <button
                                                                    key={emoji.value}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleReaction(post.id, emoji.value);
                                                                    }}
                                                                    className={cn(
                                                                        "w-8 h-8 flex items-center justify-center text-lg rounded-full hover:bg-white/20 hover:scale-125 transition-all duration-200",
                                                                        post.user_reaction === emoji.value ? "bg-white/20 scale-110" : ""
                                                                    )}
                                                                    title={emoji.label}
                                                                >
                                                                    {emoji.icon}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <span className="text-sm font-medium text-white">
                                                        {post.likes_count}
                                                    </span>
                                                </div>
                                                {post.is_featured && (
                                                    <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-yellow-500/30 backdrop-blur-sm">
                                                        FEATURED
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default CommunityPage;
