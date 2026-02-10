import { Link } from 'react-router-dom';
import { Banner } from '@/hooks/useContent';
import { cn } from '@/lib/utils';

export function SidebarBanner({ banners }: { banners: Banner[] }) {
    if (!banners || banners.length === 0) return null;

    return (
        <div className="space-y-4 mt-6">
            {banners.map((banner) => (
                <Link
                    key={banner.id}
                    to={banner.link_url || '#'}
                    className={cn(
                        "block relative overflow-hidden rounded-lg group",
                        !banner.link_url && "cursor-default"
                    )}
                >
                    <div className="aspect-[3/4] w-full overflow-hidden bg-muted">
                        <img
                            src={banner.image_url}
                            alt={banner.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
                            <h4 className="font-bold text-white text-lg leading-tight">
                                {banner.title}
                            </h4>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
