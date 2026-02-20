import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from '@/lib/utils';

interface ImageLightboxProps {
    images: string[];
    initialIndex?: number;
    isOpen: boolean;
    onClose: () => void;
    title?: string;
}

export function ImageLightbox({ images, initialIndex = 0, isOpen, onClose, title = "Image Gallery" }: ImageLightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Sync index when opened
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
        }
    }, [isOpen, initialIndex]);

    const hasMultipleImages = images.length > 1;

    const goToPrevious = useCallback(() => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }, [images.length]);

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, [images.length]);

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'ArrowLeft') goToPrevious();
            if (e.key === 'ArrowRight') goToNext();
        },
        [isOpen, goToPrevious, goToNext]
    );

    // Touch navigation
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            goToNext();
        } else if (isRightSwipe) {
            goToPrevious();
        }
    };

    if (!images || images.length === 0) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            {/* We use DialogPrimitive directly for more control over the overlay and content styling without default close buttons interfering */}
            <DialogContent
                className="max-w-[100vw] h-[100dvh] p-0 border-none bg-black/95 backdrop-blur-3xl duration-300 flex flex-col justify-center sm:rounded-none m-0 shadow-none overflow-hidden"
                onKeyDown={handleKeyDown}
                aria-describedby="lightbox-description"
            >
                <DialogTitle className="sr-only">{title}</DialogTitle>
                <DialogDescription id="lightbox-description" className="sr-only">
                    Full screen image viewer. Use left and right arrows to navigate.
                </DialogDescription>

                <div
                    className="relative w-full h-full flex items-center justify-center outline-none"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    tabIndex={-1}
                >
                    {/* Header Actions */}
                    <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/60 to-transparent">
                        <div className="text-white/80 font-medium text-sm drop-shadow-md">
                            {hasMultipleImages && `${currentIndex + 1} / ${images.length}`}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 rounded-full h-10 w-10 sm:h-12 sm:w-12 backdrop-blur-md"
                            onClick={onClose}
                        >
                            <X className="h-5 w-5 sm:h-6 sm:w-6" />
                        </Button>
                    </div>

                    {/* Main Image */}
                    <div className="w-full h-full p-4 sm:p-12 flex items-center justify-center">
                        <img
                            src={images[currentIndex]}
                            alt={`Gallery image ${currentIndex + 1}`}
                            className="max-w-full max-h-full object-contain drop-shadow-2xl select-none"
                            draggable={false}
                        />
                    </div>

                    {/* Navigation Controls */}
                    {hasMultipleImages && (
                        <>
                            {/* Desktop specific buttons, hidden on small screens where swipe is preferred */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full h-14 w-14 backdrop-blur-md transition-transform hover:scale-110"
                                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full h-14 w-14 backdrop-blur-md transition-transform hover:scale-110"
                                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                            >
                                <ChevronRight className="h-8 w-8" />
                            </Button>

                            {/* Mobile tap zones */}
                            <div
                                className="absolute inset-y-20 left-0 w-1/4 z-40 sm:hidden"
                                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                            />
                            <div
                                className="absolute inset-y-20 right-0 w-1/4 z-40 sm:hidden"
                                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                            />
                        </>
                    )}

                    {/* Thumbnails Strip (Desktop only for better UX) */}
                    {hasMultipleImages && (
                        <div className="absolute bottom-6 inset-x-0 hidden sm:flex justify-center z-50">
                            <div className="flex gap-2 p-2 bg-black/40 backdrop-blur-md rounded-2xl max-w-[80vw] overflow-x-auto scrollbar-hide">
                                {images.map((image, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                                        className={cn(
                                            "relative h-14 w-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all duration-300",
                                            currentIndex === idx
                                                ? "border-white scale-110 shadow-lg"
                                                : "border-transparent opacity-50 hover:opacity-100"
                                        )}
                                    >
                                        <img
                                            src={image}
                                            alt={`Thumbnail ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
