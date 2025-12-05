import { useState, useEffect } from 'react';
import { Star, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReviewFormProps {
    productId: string;
    userId: string;
    onSuccess: () => void;
}

const ReviewForm = ({ productId, userId, onSuccess }: ReviewFormProps) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [canReview, setCanReview] = useState<boolean | null>(null); // null = loading
    const { toast } = useToast();

    useEffect(() => {
        checkEligibility();
    }, [productId, userId]);

    const checkEligibility = async () => {
        try {
            if (!productId) return;

            // Check if user has purchased the product
            const { data, error } = await supabase
                .rpc('check_user_purchased', { check_product_id: productId });

            if (error) throw error;
            setCanReview(data);
        } catch (error) {
            console.error('Error checking review eligibility:', error);
            // Default to false on error to be safe, or true if you want to be lenient
            setCanReview(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast({ title: "Rating required", description: "Please select a star rating.", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('product_reviews')
                .insert({
                    product_id: productId,
                    user_id: userId,
                    rating,
                    review_text: comment,
                    is_verified_purchase: canReview || false,
                    is_approved: false
                });

            if (error) throw error;

            toast({
                title: "Review Submitted",
                description: "Your review is pending approval. Thank you!",
                variant: "default"
            });

            setRating(0);
            setComment('');
            onSuccess();

        } catch (error) {
            console.error('Error submitting review:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to submit review.",
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (canReview === null) {
        return <div className="h-40 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 animate-pulse">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>;
    }

    if (!canReview) {
        return (
            <div className="bg-white/5 p-8 rounded-xl border border-white/10 text-center space-y-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                    <h3 className="text-lg font-medium text-white">Verified Purchase Only</h3>
                    <p className="text-sm text-muted-foreground mt-1">You must purchase this product to leave a review.</p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 p-6 rounded-xl border border-white/10">
            <div>
                <h3 className="text-lg font-medium text-white mb-1">Write a Review</h3>
                <p className="text-sm text-muted-foreground">Share your experience with this product.</p>
            </div>

            <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Rating</label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className="focus:outline-none transition-all hover:scale-110 active:scale-95"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                        >
                            <Star
                                className={`w-8 h-8 transition-colors ${star <= (hoverRating || rating)
                                    ? "fill-primary text-primary"
                                    : "text-muted-foreground/30 hover:text-primary/50"
                                    }`}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Review</label>
                <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what you liked or didn't like..."
                    className="bg-black/20 border-white/10 min-h-[120px] focus:border-primary/50 transition-colors resize-none"
                />
            </div>

            <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-black hover:bg-white font-bold"
            >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Submit Review
            </Button>
        </form>
    );
};

export default ReviewForm;
