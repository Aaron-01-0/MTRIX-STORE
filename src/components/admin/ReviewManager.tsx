import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Star, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ReviewManager = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          products (name),
          profiles (first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({ title: "Error", description: "Failed to fetch reviews.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, isApproved: boolean) => {
    try {
      const { error } = await supabase
        .from('product_reviews')
        .update({ is_approved: isApproved })
        .eq('id', id);

      if (error) throw error;

      setReviews(reviews.map(r => r.id === id ? { ...r, is_approved: isApproved } : r));
      toast({
        title: isApproved ? "Review Approved" : "Review Rejected",
        description: `Review has been ${isApproved ? 'approved' : 'rejected'}.`
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  };

  const pendingReviews = reviews.filter(r => !r.is_approved);
  const approvedReviews = reviews.filter(r => r.is_approved);

  return (
    <Card className="bg-mtrix-black border-mtrix-gray">
      <CardHeader>
        <CardTitle className="text-gradient-gold text-2xl flex items-center gap-2">
          <MessageSquare className="w-6 h-6" /> Review Moderation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList className="bg-black/40 border border-white/10 mb-6">
            <TabsTrigger value="pending" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              Pending ({pendingReviews.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingReviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Check className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>All caught up! No pending reviews.</p>
              </div>
            ) : (
              pendingReviews.map((review) => (
                <ReviewCard key={review.id} review={review} onAction={handleStatusUpdate} />
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {approvedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} onAction={handleStatusUpdate} readOnly />
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const ReviewCard = ({ review, onAction, readOnly }: { review: any, onAction: any, readOnly?: boolean }) => {
  const authorName = review.profiles
    ? `${review.profiles.first_name || ''} ${review.profiles.last_name || ''}`.trim() || 'Anonymous'
    : 'Anonymous';

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-white/20">
            {review.products?.name || 'Unknown Product'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            by {authorName} • {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
          ))}
        </div>

        {review.title && <p className="font-medium text-white">{review.title}</p>}
        <p className="text-sm text-gray-300">{review.review_text}</p>
      </div>

      <div className="flex items-center gap-2">
        {readOnly ? (
          <Badge className={review.is_approved ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
            {review.is_approved ? 'APPROVED' : 'REJECTED'}
          </Badge>
        ) : (
          <>
            <Button size="sm" variant="outline" className="border-green-500/50 text-green-500 hover:bg-green-500 hover:text-white" onClick={() => onAction(review.id, true)}>
              <Check className="w-4 h-4 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => onAction(review.id, false)}>
              <X className="w-4 h-4 mr-1" /> Reject
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewManager;
