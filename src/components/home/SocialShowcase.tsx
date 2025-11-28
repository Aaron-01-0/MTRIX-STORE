import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Instagram, Play } from 'lucide-react';

interface SocialContent {
    id: string;
    platform: 'instagram_post' | 'instagram_reel';
    url: string;
    thumbnail_url: string | null;
    caption: string | null;
}

const SocialShowcase = () => {
    const [content, setContent] = useState<SocialContent[]>([]);

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const { data, error } = await supabase
                .from('social_content')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true })
                .limit(8);

            if (error) throw error;
            setContent((data || []) as SocialContent[]);
        } catch (error) {
            console.error('Error fetching social content:', error);
        }
    };

    if (content.length === 0) return null;

    const reels = content.filter(item => item.platform === 'instagram_reel').slice(0, 4);
    const posts = content.filter(item => item.platform === 'instagram_post').slice(0, 8);

    return (
        <section className="py-20 bg-mtrix-dark overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-4 flex items-center justify-center gap-3">
                        From Our Socials <span className="text-primary">🔥</span>
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        See what we're building, posting & flexing.
                    </p>
                    <a
                        href="https://instagram.com/mtrixstore"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-black px-8">
                            <Instagram className="w-4 h-4 mr-2" />
                            Follow Us @mtrixstore
                        </Button>
                    </a>
                </div>

                {/* Reels Section */}
                {reels.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                        {reels.map((reel) => (
                            <a
                                key={reel.id}
                                href={reel.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-black"
                            >
                                <img
                                    src={reel.thumbnail_url || '/placeholder.svg'}
                                    alt={reel.caption || 'Instagram Reel'}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <Play className="w-5 h-5 text-white fill-white" />
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="text-white text-xs line-clamp-2">{reel.caption}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                )}

                {/* Posts Grid */}
                {posts.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {posts.map((post) => (
                            <a
                                key={post.id}
                                href={post.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative aspect-square rounded-lg overflow-hidden bg-black"
                            >
                                <img
                                    src={post.thumbnail_url || '/placeholder.svg'}
                                    alt={post.caption || 'Instagram Post'}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                                />
                                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <Instagram className="w-8 h-8 text-white" />
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default SocialShowcase;
