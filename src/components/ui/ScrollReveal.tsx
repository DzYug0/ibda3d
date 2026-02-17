import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScrollRevealProps {
    children: React.ReactNode;
    className?: string;
    threshold?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
    delay?: number;
}

export function ScrollReveal({
    children,
    className,
    threshold = 0.1,
    direction = 'up',
    delay = 0
}: ScrollRevealProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Only animate once
                }
            },
            { threshold }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [threshold]);

    const getDirectionClass = () => {
        switch (direction) {
            case 'up': return 'translate-y-8';
            case 'down': return '-translate-y-8';
            case 'left': return 'translate-x-8';
            case 'right': return '-translate-x-8';
            default: return 'translate-y-8';
        }
    };

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={cn(
                "transition-all duration-700 ease-out",
                isVisible
                    ? "opacity-100 translate-x-0 translate-y-0"
                    : `opacity-0 ${getDirectionClass()}`,
                className
            )}
        >
            {children}
        </div>
    );
}
