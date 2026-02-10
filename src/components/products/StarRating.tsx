import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
    rating: number;
    max?: number;
    size?: number;
    interactive?: boolean;
    onRatingChange?: (rating: number) => void;
    className?: string; // Add className prop
}

export function StarRating({
    rating,
    max = 5,
    size = 20,
    interactive = false,
    onRatingChange,
    className = ""
}: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState<number | null>(null);

    const displayRating = hoverRating !== null ? hoverRating : rating;

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {Array.from({ length: max }).map((_, i) => {
                const starValue = i + 1;
                const isFull = starValue <= displayRating;
                const isHalf = !isFull && starValue - 0.5 <= displayRating; // Simplified logic, for now assume integer steps usually

                return (
                    <button
                        key={i}
                        type="button"
                        disabled={!interactive}
                        className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} focus:outline-none`}
                        onMouseEnter={() => interactive && setHoverRating(starValue)}
                        onMouseLeave={() => interactive && setHoverRating(null)}
                        onClick={() => interactive && onRatingChange?.(starValue)}
                    >
                        <Star
                            size={size}
                            className={`
                ${isFull ? 'fill-warning text-warning' : 'text-muted-foreground/30'}
                transition-colors duration-200
              `}
                        />
                    </button>
                );
            })}
        </div>
    );
}
