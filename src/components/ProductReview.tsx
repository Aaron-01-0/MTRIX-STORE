import { useState, useEffect } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProductReviewProps {
  orderId: string;
  productId: string;
  productName: string;
  onReviewSubmitted?: () => void;
}

const ProductReview = ({ orderId, productId, productName, onReviewSubmitted }: ProductReviewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user && orderId && productId) {
      checkExistingReview();
    } else {
      setLoading(false);
    }
  }, [user, orderId, productId]);

  const checkExistingReview = async () => {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('order_id', orderId)
        .eq('product_id', productId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setExistingReview(data);
        setRating(data.rating);
        setTitle(data.title || '');
        setReviewText(data.review_text || '');
      } else {
        setExistingReview(null);
        setRating(0);
        setTitle('');
        setReviewText('');
      }
    } catch (error) {
      console.error('Error checking existing review:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReview) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', existingReview.id);

      if (error) throw error;

      toast({
        title: "Review Deleted",
        description: "Your review has been removed.",
      });

      setExistingReview(null);
      setRating(0);
      setTitle('');
      setReviewText('');

      // Notify parent to refresh list if needed
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: "Error",
        description: "Failed to delete review.",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to submit a review",
        variant: "destructive"
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating",
        variant: "destructive"
      });
      return;
    }

    if (!reviewText.trim()) {
      toast({
        title: "Review Required",
        description: "Please write a review",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          user_id: user.id,
          product_id: productId,
          order_id: orderId,
          rating,
          title: title.trim() || null,
          review_text: reviewText.trim(),
          is_verified_purchase: true,
          is_approved: false
        });

      if (error) throw error;

      toast({
        title: "Review Submitted!",
        description: "Thank you for your feedback. Your review will be visible after approval."
      });

      // Refresh to show read-only view
      checkExistingReview();

      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading review status...</div>;
  }

  if (existingReview) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Your Review for {productName}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-normal px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {existingReview.is_approved ? 'Published' : 'Pending Approval'}
              </span>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-mtrix-dark border-mtrix-gray text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Review?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete your review? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-white/10 hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-500 hover:bg-red-600 text-white border-none"
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-6 h-6 ${star <= existingReview.rating
                    ? 'text-primary fill-current'
                    : 'text-muted-foreground/30'
                  }`}
              />
            ))}
          </div>

          {existingReview.title && (
            <h4 className="font-medium text-white">{existingReview.title}</h4>
          )}

          <p className="text-gray-300 leading-relaxed">
            {existingReview.review_text}
          </p>

          <div className="pt-4 border-t border-white/10 text-xs text-muted-foreground">
            Submitted on {new Date(existingReview.created_at).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">Rate & Review: {productName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star Rating */}
        <div>
          <Label>Your Rating *</Label>
          <div className="flex items-center gap-2 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${star <= (hoveredRating || rating)
                    ? 'text-primary fill-current'
                    : 'text-muted-foreground'
                    }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              {rating > 0 ? `${rating}/5` : 'Select rating'}
            </span>
          </div>
        </div>

        {/* Review Title */}
        <div>
          <Label htmlFor="review-title">Review Title (Optional)</Label>
          <Input
            id="review-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of your experience"
            maxLength={100}
            className="mt-1"
          />
        </div>

        {/* Review Text */}
        <div>
          <Label htmlFor="review-text">Your Review *</Label>
          <Textarea
            id="review-text"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your thoughts about the product quality, design, and overall experience..."
            rows={6}
            maxLength={1000}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {reviewText.length}/1000 characters
          </p>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={submitting || rating === 0 || !reviewText.trim()}
          className="w-full bg-gradient-gold text-mtrix-black hover:shadow-gold"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProductReview;
