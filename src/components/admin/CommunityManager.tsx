import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Trash2, Star, StarOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CommunityPost {
    id: string;
    user_id: string;
    product_id: string | null;
    image_url: string;
    caption: string | null;
    status: 'pending' | 'approved' | 'rejected';
    likes_count: number;
    is_featured: boolean;
    created_at: string;
    profiles?: {
        name: string | null;
        first_name: string | null;
        last_name: string | null;
    };
}

const CommunityManager = () => {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            // 1. Fetch posts
            const { data: postsData, error: postsError } = await supabase
                .from('community_posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (postsError) throw postsError;

            if (!postsData || postsData.length === 0) {
                setPosts([]);
                return;
            }

            // 2. Fetch profiles for these posts
            const userIds = [...new Set(postsData.map(p => p.user_id))];
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, user_id, name, first_name, last_name')
                .in('user_id', userIds);

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
            }

            // 3. Map profiles to posts
            const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

            const postsWithProfiles = postsData.map(post => ({
                ...post,
                profiles: profilesMap.get(post.user_id) || null
            }));

            setPosts(postsWithProfiles as any);
        } catch (error: any) {
            console.error('Error fetching posts:', error);
            toast({
                title: "Error",
                description: "Failed to fetch posts: " + (error.message || "Unknown error"),
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('community_posts')
                .update({ status })
                .eq('id', id);

            if (error) throw error;

            setPosts(posts.map(p => p.id === id ? { ...p, status } : p));
            toast({
                title: "Success",
                description: `Post marked as ${status}`
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to update status",
                variant: "destructive"
            });
        }
    };

    const toggleFeatured = async (id: string, current: boolean) => {
        try {
            const { error } = await supabase
                .from('community_posts')
                .update({ is_featured: !current })
                .eq('id', id);

            if (error) throw error;

            setPosts(posts.map(p => p.id === id ? { ...p, is_featured: !current } : p));
            toast({
                title: "Success",
                description: `Post ${!current ? 'featured' : 'unfeatured'}`
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to update featured status",
                variant: "destructive"
            });
        }
    };

    const deletePost = async (id: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const { error } = await supabase
                .from('community_posts')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setPosts(posts.filter(p => p.id !== id));
            toast({
                title: "Success",
                description: "Post deleted"
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to delete post",
                variant: "destructive"
            });
        }
    };

    const PostCard = ({ post }: { post: CommunityPost }) => (
        <Card className="overflow-hidden bg-black/40 border-white/10">
            <div className="aspect-square relative group">
                <img
                    src={post.image_url}
                    alt={post.caption || 'Community post'}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {post.status === 'pending' && (
                        <>
                            <Button size="icon" className="bg-green-500 hover:bg-green-600" onClick={() => updateStatus(post.id, 'approved')}>
                                <Check className="w-4 h-4" />
                            </Button>
                            <Button size="icon" className="bg-red-500 hover:bg-red-600" onClick={() => updateStatus(post.id, 'rejected')}>
                                <X className="w-4 h-4" />
                            </Button>
                        </>
                    )}
                    <Button size="icon" variant="destructive" onClick={() => deletePost(post.id)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
                {post.is_featured && (
                    <div className="absolute top-2 right-2">
                        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">Featured</Badge>
                    </div>
                )}
            </div>
            <div className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                    <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                        {post.profiles?.name ||
                            (post.profiles?.first_name ? `${post.profiles.first_name} ${post.profiles.last_name || ''}` : 'Unknown User')}
                    </p>
                    <Badge variant={post.status === 'approved' ? 'default' : post.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {post.status}
                    </Badge>
                </div>
                {post.caption && (
                    <p className="text-sm line-clamp-2">{post.caption}</p>
                )}
                <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                    </span>
                    {post.status === 'approved' && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className={post.is_featured ? "text-yellow-500" : "text-muted-foreground"}
                            onClick={() => toggleFeatured(post.id, post.is_featured)}
                        >
                            {post.is_featured ? <Star className="w-4 h-4 mr-1 fill-current" /> : <StarOff className="w-4 h-4 mr-1" />}
                            Feature
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );

    if (loading) return <div>Loading...</div>;

    const pendingPosts = posts.filter(p => p.status === 'pending');
    const approvedPosts = posts.filter(p => p.status === 'approved');
    const rejectedPosts = posts.filter(p => p.status === 'rejected');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Community Manager</h2>
                <div className="text-sm text-muted-foreground">
                    Total Posts: {posts.length}
                </div>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="bg-black/40 border border-white/10">
                    <TabsTrigger value="pending">Pending ({pendingPosts.length})</TabsTrigger>
                    <TabsTrigger value="approved">Approved ({approvedPosts.length})</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected ({rejectedPosts.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-6">
                    {pendingPosts.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">No pending posts</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {pendingPosts.map(post => <PostCard key={post.id} post={post} />)}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="approved" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {approvedPosts.map(post => <PostCard key={post.id} post={post} />)}
                    </div>
                </TabsContent>

                <TabsContent value="rejected" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {rejectedPosts.map(post => <PostCard key={post.id} post={post} />)}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default CommunityManager;
