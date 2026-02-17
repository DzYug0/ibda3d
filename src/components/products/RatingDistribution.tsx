import { Progress } from "@/components/ui/progress";
import { StarRating } from "./StarRating";
import { useLanguage } from "@/i18n/LanguageContext";

interface RatingDistributionProps {
    reviews: any[];
}

export function RatingDistribution({ reviews }: RatingDistributionProps) {
    const { t } = useLanguage();

    if (!reviews || reviews.length === 0) return null;

    const totalReviews = reviews.length;
    const distribution = {
        5: reviews.filter((r) => r.rating === 5).length,
        4: reviews.filter((r) => r.rating === 4).length,
        3: reviews.filter((r) => r.rating === 3).length,
        2: reviews.filter((r) => r.rating === 2).length,
        1: reviews.filter((r) => r.rating === 1).length,
    };

    const averageRating =
        reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews;

    return (
        <div className="bg-muted/30 p-6 rounded-2xl border border-border">
            <div className="flex flex-col md:flex-row gap-8 items-center">
                {/* Overall Rating */}
                <div className="text-center md:text-start min-w-[120px]">
                    <div className="text-5xl font-bold text-foreground">
                        {averageRating.toFixed(1)}
                    </div>
                    <div className="flex justify-center md:justify-start my-2">
                        <StarRating rating={Math.round(averageRating)} size={20} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {totalReviews} {t.reviews?.title || "Reviews"}
                    </p>
                </div>

                {/* Progress Bars */}
                <div className="flex-1 w-full space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = distribution[star as keyof typeof distribution];
                        const percentage = (count / totalReviews) * 100;

                        return (
                            <div key={star} className="flex items-center gap-3 text-sm">
                                <div className="w-12 text-muted-foreground flex items-center gap-1">
                                    {star} <span className="text-xs">★</span>
                                </div>
                                <Progress value={percentage} className="h-2" />
                                <div className="w-8 text-end text-muted-foreground text-xs">
                                    {count}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
