import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean;
}

export const OptimizedImage = ({
    src,
    alt,
    width,
    height,
    className,
    priority = false,
    ...props
}: OptimizedImageProps) => {
    const [isLoaded, setIsLoaded] = useState(false);

    // Helper to construct Supabase transformation URL
    const getOptimizedUrl = (url: string, w?: number) => {
        if (!url) return '';
        // Check if it's a Supabase Storage URL
        if (url.includes('supabase.co/storage/v1/object/public')) {
            const separator = url.includes('?') ? '&' : '?';
            let params = `quality=75&format=webp`;
            if (w) params += `&width=${w}`;
            return `${url}${separator}${params}`;
        }
        return url;
    };

    const optimizedSrc = getOptimizedUrl(src, width);

    return (
        <img
            src={optimizedSrc}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? "eager" : "lazy"}
            className={cn(
                "transition-opacity duration-300",
                isLoaded ? "opacity-100" : "opacity-0",
                className
            )}
            onLoad={() => setIsLoaded(true)}
            {...props}
        />
    );
};
