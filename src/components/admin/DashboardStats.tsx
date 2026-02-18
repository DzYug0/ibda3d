import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsProps {
    stats: {
        icon: LucideIcon;
        label: string;
        value: string;
        trend?: number;
        trendLabel?: string;
        color: string;
    }[];
}

export function DashboardStats({ stats }: StatsProps) {
    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <Card key={index} className="overflow-hidden border-border transition-all hover:shadow-md">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className={cn("p-2 rounded-lg", stat.color.replace('text-', 'bg-').replace(' ', '/10 text-'))}>
                                <stat.icon className={cn("h-5 w-5", stat.color)} />
                            </div>
                            {stat.trend !== undefined && (
                                <div className={cn(
                                    "flex items-center text-xs font-medium px-2 py-1 rounded-full",
                                    stat.trend >= 0 ? "text-green-600 bg-green-500/10" : "text-red-600 bg-red-500/10"
                                )}>
                                    {stat.trend >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                    {Math.abs(stat.trend)}%
                                </div>
                            )}
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                            <h3 className="text-2xl font-bold tracking-tight mt-1">{stat.value}</h3>
                            {stat.trendLabel && (
                                <p className="text-xs text-muted-foreground mt-2">{stat.trendLabel}</p>
                            )}
                        </div>
                        {/* Sparkline decoration */}
                        <div className="absolute bottom-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-primary/5 to-transparent block opacity-50" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
