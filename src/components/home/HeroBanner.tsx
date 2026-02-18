import { Link } from 'react-router-dom';
import { ArrowRight, Printer, Box, Layers } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { Banner } from '@/hooks/useContent';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    CarouselDots,
} from "@/components/ui/carousel";
import logo from '@/assets/logo.png';
import { cn } from '@/lib/utils';

export function HeroBanner({ banners }: { banners: Banner[] }) {
    const { t } = useLanguage();

    if (!banners || banners.length === 0) {
        // Fallback to default static hero
        return (
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-primary" />
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-primary/30 blur-3xl animate-pulse" />
                    <div className="absolute top-40 right-10 w-96 h-96 rounded-full bg-secondary/40 blur-3xl" />
                    <div className="absolute bottom-10 left-1/3 w-64 h-64 rounded-full bg-accent/30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute -bottom-20 right-1/4 w-72 h-72 rounded-full bg-destructive/20 blur-3xl" />
                    <div className="absolute inset-0 opacity-10">
                        <div className="w-full h-full" style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                            backgroundSize: '60px 60px'
                        }} />
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8 sm:py-20 md:py-32 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="animate-slide-up text-center lg:text-start">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                                <Printer className="h-4 w-4 text-accent" />
                                <span className="text-sm text-white/90 font-medium">{t.hero.badge}</span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight text-white">
                                {t.hero.title1}
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-white to-accent">
                                    {t.hero.title2}
                                </span>
                            </h1>

                            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-lg mx-auto lg:mx-0">
                                {t.hero.subtitle}
                            </p>

                            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                                <Link to="/products">
                                    <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 shadow-lg hover:shadow-xl transition-all">
                                        {t.hero.discover} <ArrowRight className="ms-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link to="/categories">
                                    <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm">
                                        {t.hero.ourCategories}
                                    </Button>
                                </Link>
                            </div>

                            <div className="flex gap-8 mt-12 justify-center lg:justify-start">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-accent">58</div>
                                    <div className="text-sm text-white/60">{t.hero.wilayas}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-white">24/7</div>
                                    <div className="text-sm text-white/60">{t.hero.support}</div>
                                </div>
                            </div>
                        </div>

                        <div className="relative mt-12 lg:mt-0 flex justify-center items-center">
                            <div className="relative w-72 h-72 sm:w-80 sm:h-80 lg:w-[450px] lg:h-[450px]">
                                <div className="absolute inset-0 bg-accent/20 rounded-full blur-3xl scale-150" />
                                <img src={logo} alt="Ibda3D" className="relative w-full h-full object-contain drop-shadow-2xl animate-fade-in" />
                            </div>
                            <div className="absolute top-10 right-10 bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-xl animate-bounce-in" style={{ animationDelay: '0.2s' }}>
                                <Box className="h-8 w-8 text-accent" />
                            </div>
                            <div className="absolute bottom-20 left-0 bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-xl animate-bounce-in" style={{ animationDelay: '0.4s' }}>
                                <Layers className="h-8 w-8 text-white" />
                            </div>
                            <div className="absolute bottom-10 right-20 bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-xl animate-bounce-in" style={{ animationDelay: '0.6s' }}>
                                <Printer className="h-8 w-8 text-destructive" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="relative overflow-hidden w-full">
            <Carousel
                className="w-full"
                opts={{
                    loop: true,
                }}
            >
                <CarouselContent>
                    {banners.map((banner, index) => (
                        <CarouselItem key={banner.id} className="relative w-full">
                            <div className="relative w-full aspect-[21/9] min-h-[400px] md:min-h-[500px] lg:min-h-[600px] overflow-hidden bg-muted">
                                <OptimizedImage
                                    src={banner.image_url}
                                    alt={banner.title}
                                    width={1920}
                                    priority={index === 0}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

                                <div className="absolute inset-0 flex items-center">
                                    <div className="container mx-auto px-4">
                                        <div className="max-w-2xl animate-slide-up">
                                            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white leading-tight">
                                                {banner.title}
                                            </h2>
                                            {banner.link_url && (
                                                <Link to={banner.link_url}>
                                                    <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 shadow-lg">
                                                        {t.hero.discover} <ArrowRight className="ms-2 h-5 w-5" />
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                {banners.length > 1 && (
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
                        <CarouselDots className="gap-3 [&>button]:bg-white/50 [&>button.bg-primary]:bg-white [&>button.bg-primary]:w-8" />
                    </div>
                )}
            </Carousel>
        </section>
    );
}
