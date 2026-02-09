import { Link } from 'react-router-dom';
import { Banner } from '@/hooks/useContent';
import { cn } from '@/lib/utils'; // Assuming this exists, based on usual Shadcn setup

export function PromoBanner({ banners }: { banners: Banner[] }) {
    if (!banners || banners.length === 0) return null;

    return (
        <section className="py-8 container mx-auto px-4">
            <div className={cn(
                "grid gap-4",
                banners.length === 1 ? "grid-cols-1" :
                    banners.length === 2 ? "grid-cols-1 md:grid-cols-2" :
                        "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            )}>
                {banners.map((banner) => (
                    <Link
                        key={banner.id}
                        to={banner.link_url || '#'}
                        className={cn(
                            "relative block overflow-hidden rounded-xl group",
                            !banner.link_url && "cursor-default"
                        )}
                    >
                        <div className="aspect-[21/9] w-full overflow-hidden bg-muted">
                            <img
                                src={banner.image_url}
                                alt={banner.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                            <div className="absolute flex items-end p-6 bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent">
                                <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                                    {banner.title}
                                </h3>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
