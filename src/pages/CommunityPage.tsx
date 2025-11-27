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
}

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

            // Fetch approved posts
            const { data: postsData, error: postsError } = await supabase
                .from('community_posts')
                .select('*')
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (postsError) throw postsError;

            let postsWithLikes = postsData as Post[];

            // If user is logged in, check which posts they liked
            if (user && postsData.length > 0) {
                const { data: likesData } = await supabase
                    .from('post_likes')
                    .select('post_id')
                    .eq('user_id', user.id)
                    .in('post_id', postsData.map(p => p.id));

                const likedPostIds = new Set(likesData?.map(l => l.post_id));
                postsWithLikes = postsData.map(p => ({
                    ...p,
                    has_liked: likedPostIds.has(p.id)
                }));
            }

            setPosts(postsWithLikes);
        } catch (error) {
            console.error('Error fetching community posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (postId: string, currentLiked: boolean) => {
        if (!user) {
            toast({
                title: "Sign in required",
                description: "Please sign in to like posts",
                variant: "destructive"
            });
            return;
        }

        // Optimistic update
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    has_liked: !currentLiked,
                    likes_count: currentLiked ? p.likes_count - 1 : p.likes_count + 1
                };
            }
            return p;
        }));

        try {
            if (currentLiked) {
                await supabase
                    .from('post_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', user.id);
            } else {
                await supabase
                    .from('post_likes')
                    .insert({
                        post_id: postId,
                        user_id: user.id
                    });
            }
        } catch (error) {
            // Revert on error
            console.error('Error toggling like:', error);
            fetchPosts(); // Refetch to sync
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
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                            {post.caption && (
                                                <p className="text-white text-sm mb-4 line-clamp-2 font-medium">
                                                    {post.caption}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className={cn(
                                                            "rounded-full hover:bg-white/20 transition-colors",
                                                            post.has_liked ? "text-red-500 hover:text-red-600" : "text-white"
                                                        )}
                                                        onClick={() => handleLike(post.id, !!post.has_liked)}
                                                    >
                                                        <Heart className={cn("w-6 h-6", post.has_liked && "fill-current")} />
                                                    </Button>
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
