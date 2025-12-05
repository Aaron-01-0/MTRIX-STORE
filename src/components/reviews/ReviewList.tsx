import { useState, useEffect } from 'react';
import { Star, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface ReviewListProps {
    productId: string;
    refreshTrigger: number;
}

const ReviewList = ({ productId, refreshTrigger }: ReviewListProps) => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [stats, setStats] = useState({ avg: 0, total: 0, distribution: [0, 0, 0, 0, 0] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, [productId, refreshTrigger]);

    const fetchReviews = async () => {
        try {
            const { data, error } = await supabase
                .from('product_reviews')
                .select(`
          id,
          rating,
          review_text,
          title,
          is_verified_purchase,
          created_at,
          profiles (first_name, last_name, avatar_url)
        `)
                .eq('product_id', productId)
                .eq('is_approved', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setReviews(data || []);
            calculateStats(data || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: any[]) => {
        if (data.length === 0) {
            setStats({ avg: 0, total: 0, distribution: [0, 0, 0, 0, 0] });
            return;
        }

        const total = data.length;
        const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
        const avg = sum / total;

        const distribution = [0, 0, 0, 0, 0];
        data.forEach(r => {
            const rating = Math.round(r.rating);
            if (rating >= 1 && rating <= 5) {
                distribution[5 - rating]++; // Index 0 = 5 stars, Index 4 = 1 star
            }
        });

        setStats({ avg, total, distribution });
    };

    if (loading) return <div className="animate-pulse h-40 bg-white/5 rounded-xl border border-white/10" />;

    return (
        <div className="space-y-8">
            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 bg-white/5 rounded-xl border border-white/10">
                <div className="text-center md:text-left flex flex-col justify-center">
                    <div className="text-5xl font-bold text-white mb-2">
                        {isNaN(stats.avg) ? "0.0" : stats.avg.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`w-5 h-5 ${star <= Math.round(stats.avg) ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                            />
                        ))}
                    </div>
                    <p className="text-muted-foreground">{stats.total} Review{stats.total !== 1 ? 's' : ''}</p>
                </div>

                <div className="col-span-2 space-y-3">
                    {stats.distribution.map((count, idx) => {
                        const stars = 5 - idx;
                        const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                        return (
                            <div key={stars} className="flex items-center gap-4 text-sm">
                                <div className="w-12 text-muted-foreground flex items-center gap-1 font-medium">
                                    {stars} <Star className="w-3 h-3" />
                                </div>
                                <Progress value={percentage} className="h-2 bg-white/10" />
                                <div className="w-8 text-right text-muted-foreground text-xs">{count}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-6">
                {reviews.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                        <p className="text-muted-foreground mb-2">No reviews yet.</p>
                        <p className="text-primary font-medium">Be the first to try this product once it’s back!</p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="border-b border-white/10 pb-6 last:border-0 last:pb-0">
                            <div className="flex items-start gap-4">
                                <Avatar className="w-10 h-10 border border-white/10">
                                    <AvatarImage src={review.profiles?.avatar_url} />
                                    <AvatarFallback className="bg-white/10 text-white"><User className="w-5 h-5" /></AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-white">
                                            {review.profiles ? `${review.profiles.first_name || ''} ${review.profiles.last_name || ''}`.trim() || 'Anonymous' : 'Anonymous'}
                                        </h4>
                                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-3 h-3 ${i < review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                                            />
                                        ))}
                                    </div>
                                    {review.title && <h5 className="font-medium text-white text-sm mt-1">{review.title}</h5>}
                                    <p className="text-gray-300 leading-relaxed text-sm">{review.review_text}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReviewList;
