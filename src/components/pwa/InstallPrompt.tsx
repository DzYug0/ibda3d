import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function InstallPrompt() {
    const { isInstallable, install } = usePWA();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isInstallable) {
            // Show prompt after a delay to not annoy user immediately
            const timer = setTimeout(() => setIsVisible(true), 3000);
            return () => clearTimeout(timer);
        }
    }, [isInstallable]);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
            >
                <div className="bg-background/80 backdrop-blur-md border border-primary/20 p-4 rounded-2xl shadow-lg flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-xl">
                        <Download className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-sm">Install Ibda3D App</h3>
                        <p className="text-xs text-muted-foreground">Get the best experience with our native app.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={install} className="rounded-full h-8 px-4">
                            Install
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-muted"
                            onClick={() => setIsVisible(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
