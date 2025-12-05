import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface Review {
    id: string;
    rating: number;
    review_text: string;
    created_at: string;
    profiles: {
        full_name: string;
        avatar_url: string | null;
    };
    products: {
        id: string;
        name: string;
        product_images: {
            image_url: string;
        }[];
    };
}

const LatestReviews = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchLatestReviews();
    }, []);

    const fetchLatestReviews = async () => {
        try {
            const { data, error } = await supabase
                .from('product_reviews')
                .select(`
          id,
          rating,
          review_text,
          created_at,
          profiles (full_name, avatar_url),
          products (
            id,
            name,
            product_images (
              image_url
            )
          )
        `)
                .eq('is_approved', true)
                .order('created_at', { ascending: false })
                .limit(6);

            if (error) throw error;

            // Transform data to match interface (handling arrays from joins)
            const formattedReviews = data.map((item: any) => ({
                ...item,
                products: {
                    ...item.products,
                    product_images: item.products.product_images || []
                }
            }));

            setReviews(formattedReviews);
        } catch (error) {
            console.error('Error fetching latest reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || reviews.length === 0) return null;

    return (
        <section className="py-20 bg-black relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-orbitron font-bold text-white mb-4">
                        COMMUNITY <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-white">VOICES</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        See what our collectors are saying about their MTRIX pieces.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reviews.map((review, idx) => (
                        <Card
                            key={review.id}
                            className="bg-white/5 border-white/10 hover:border-gold/30 transition-all duration-300 group cursor-pointer h-full"
                            onClick={() => navigate(`/product/${review.products.id}`)}
                        >
                            <CardContent className="p-6 flex flex-col h-full">
                                {/* Product Info */}
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                                    <div className="w-12 h-12 rounded bg-black overflow-hidden border border-white/10">
                                        <img
                                            src={review.products.product_images[0]?.image_url || '/placeholder.svg'}
                                            alt={review.products.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate group-hover:text-gold transition-colors">
                                            {review.products.name}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-3 h-3 ${i < review.rating ? "fill-gold text-gold" : "text-muted-foreground/30"}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Review Content */}
                                <div className="flex-1 relative">
                                    <Quote className="absolute -top-1 -left-1 w-6 h-6 text-gold/20 rotate-180" />
                                    <p className="text-gray-300 text-sm leading-relaxed pl-6 italic line-clamp-4">
                                        "{review.review_text}"
                                    </p>
                                </div>

                                {/* User Info */}
                                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/5">
                                    <Avatar className="w-8 h-8 border border-white/10">
                                        <AvatarImage src={review.profiles?.avatar_url || undefined} />
                                        <AvatarFallback className="bg-gold/10 text-gold text-xs">
                                            {review.profiles?.full_name?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-white">
                                            {review.profiles?.full_name || 'Verified Buyer'}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LatestReviews;
