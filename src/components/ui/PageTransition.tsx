import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
    const location = useLocation();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(false);
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    return (
        <div
            className={cn(
                "transition-all duration-500 ease-in-out",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
                className
            )}
        >
            {children}
        </div>
    );
}
