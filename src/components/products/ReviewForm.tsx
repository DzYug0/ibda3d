import { useState } from 'react';
import { useSubmitReview } from '@/hooks/useReviews';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Link } from 'react-router-dom';

interface ReviewFormProps {
    productId: string;
    onSuccess?: () => void;
}

export function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const { mutate: submitReview, isPending } = useSubmitReview();
    const { user } = useAuth();
    const { t } = useLanguage();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;

        submitReview({ productId, rating, comment }, {
            onSuccess: () => {
                setRating(0);
                setComment('');
                onSuccess?.();
            }
        });
    };

    if (!user) {
        return (
            <div className="bg-muted/30 p-6 rounded-xl text-center border border-dashed border-border">
                <p className="text-muted-foreground mb-4">{t.reviews?.loginToReview || "Please log in to leave a review."}</p>
                <Link to="/auth">
                    <Button variant="outline">{t.auth.signIn}</Button>
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-xl border border-border">
            <h3 className="font-semibold text-lg">{t.reviews?.writeReview || "Write a Review"}</h3>

            <div className="space-y-2">
                <Label>{t.reviews?.rating || "Rating"}</Label>
                <StarRating
                    rating={rating}
                    max={5}
                    size={24}
                    interactive
                    onRatingChange={setRating}
                />
                {rating === 0 && <p className="text-xs text-muted-foreground animate-pulse">Select stars to rate</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="comment">{t.reviews?.comment || "Comment"}</Label>
                <Textarea
                    id="comment"
                    placeholder={t.reviews?.commentPlaceholder || "Share your experience..."}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px]"
                />
            </div>

            <Button type="submit" disabled={isPending || rating === 0}>
                {isPending ? (t.common?.submitting || "Submitting...") : (t.reviews?.submit || "Submit Review")}
            </Button>
        </form>
    );
}
