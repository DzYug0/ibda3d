import { useProductReviews } from '@/hooks/useReviews';
import { StarRating } from './StarRating';
import { RatingDistribution } from './RatingDistribution';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/i18n/LanguageContext';
import { CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReviewListProps {
    productId: string;
}

export function ReviewList({ productId }: ReviewListProps) {
    const { data: reviews, isLoading } = useProductReviews(productId);
    const { t } = useLanguage();

    if (isLoading) {
        return <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 animate-pulse">
                    <div className="h-10 w-10 bg-muted rounded-full" />
                    <div className="space-y-2 flex-1">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-3 w-24 bg-muted rounded" />
                        <div className="h-16 w-full bg-muted rounded" />
                    </div>
                </div>
            ))}
        </div>;
    }

    if (!reviews || reviews.length === 0) {
        return (
            <div className="text-center py-10 bg-muted/30 rounded-xl">
                <p className="text-muted-foreground">{t.reviews?.noReviews || "No reviews yet. Be the first to verify this product!"}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <RatingDistribution reviews={reviews} />

            <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    {t.reviews?.latestReviews || "Latest Reviews"}
                    <span className="text-muted-foreground text-sm font-normal">({reviews.length})</span>
                </h3>
                {reviews.map((review) => (
                    <div key={review.id} className="flex gap-4 p-5 rounded-2xl bg-card border border-border/60 transition-all hover:bg-card/80 hover:shadow-md hover:border-primary/20">
                        <Avatar className="h-10 w-10 border border-border ring-2 ring-background">
                            <AvatarImage src={review.user?.avatar_url || ''} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-bold">
                                {review.user?.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold text-foreground text-sm">@{review.user?.username || 'Anonymous'}</p>
                                        <Badge variant="secondary" className="text-[10px] px-1.5 h-5 gap-0.5 bg-green-500/10 text-green-600 border-green-200/50 hover:bg-green-500/20">
                                            <CheckCircle2 className="h-3 w-3" />
                                            {t.reviews?.verifiedPurchase || "Verified"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StarRating rating={review.rating} size={14} />
                                        <span className="text-xs text-muted-foreground">• {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}</span>
                                    </div>
                                </div>
                            </div>
                            {review.comment && (
                                <p className="text-foreground/80 text-sm leading-relaxed bg-muted/30 p-3 rounded-xl rounded-tl-none">
                                    {review.comment}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
