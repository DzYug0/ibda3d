import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface WishlistButtonProps {
    productId: string;
    className?: string;
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function WishlistButton({ productId, className, variant = 'ghost', size = 'icon' }: WishlistButtonProps) {
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isWishlisted = isInWishlist(productId);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            navigate('/auth');
            return;
        }

        toggleWishlist(productId);
    };

    return (
        <Button
            variant={variant}
            size={size}
            className={cn('transition-colors', className)}
            onClick={handleClick}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
            <Heart
                className={cn(
                    'h-5 w-5 transition-all',
                    isWishlisted ? 'fill-red-500 text-red-500 scale-110' : 'text-muted-foreground hover:scale-110'
                )}
            />
        </Button>
    );
}
