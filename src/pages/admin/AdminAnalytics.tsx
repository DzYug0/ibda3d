import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, Eye, Globe, MousePointer, ArrowUpRight, Loader2, Calendar, Smartphone } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

// Mock data for initial render or fallback
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const DEVICE_COLORS = ['#8b5cf6', '#3b82f6', '#f59e0b'];

export default function AdminAnalytics() {
    const [timeRange, setTimeRange] = useState("7"); // Days

    // Fetch Analytics Data
    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin-analytics', timeRange],
        queryFn: async () => {
            const startDate = subDays(new Date(), parseInt(timeRange));
            const { data, error } = await (supabase.from('web_analytics' as any) as any)
                .select('*')
                .gte('created_at', startDate.toISOString());

            if (error) throw error;
            return processAnalyticsData(data, parseInt(timeRange));
        }
    });

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // If no data or error, use empty structure
    const data = stats || {
        totalVisitors: 0,
        totalPageViews: 0,
        bounceRate: 0,
        avgSessionDuration: "0s",
        trafficSource: [],
        deviceTypeData: [],
        topPages: [],
        dailyVisits: []
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
                    <p className="text-muted-foreground mt-1">Overview of your store's traffic and performance.</p>
                </div>
                <div className="flex items-center gap-2 bg-card border border-border/50 p-1 rounded-lg">
                    <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[140px] border-0 bg-transparent focus:ring-0 h-8">
                            <SelectValue placeholder="Select Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 Days</SelectItem>
                            <SelectItem value="30">Last 30 Days</SelectItem>
                            <SelectItem value="90">Last 3 Months</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Visitors"
                    value={data.totalVisitors.toLocaleString()}
                    icon={<Users className="h-5 w-5 text-blue-500" />}
                    trend="+12%" // Mock trend for now
                    trendUp={true}
                />
                <MetricCard
                    title="Page Views"
                    value={data.totalPageViews.toLocaleString()}
                    icon={<Eye className="h-5 w-5 text-emerald-500" />}
                    trend="+8%"
                    trendUp={true}
                />
                <MetricCard
                    title="Bounce Rate"
                    value={`${data.bounceRate}%`}
                    icon={<ArrowUpRight className="h-5 w-5 text-amber-500" />}
                    trend="-2%"
                    trendUp={true} // Lower bounce rate is good
                    inverseTrend
                />
                <MetricCard
                    title="Avg. Session"
                    value={data.avgSessionDuration}
                    icon={<MousePointer className="h-5 w-5 text-purple-500" />}
                    trend="+5%"
                    trendUp={true}
                />
            </div>

            {/* Charts Row 1: Daily Visits */}
            <Card className="border-border/50 shadow-sm bg-card/40 backdrop-blur-xl">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Daily Visitors
                    </CardTitle>
                    <CardDescription>
                        Unique visitors over the last {timeRange} days
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.dailyVisits}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="visitors" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Charts Row 2: Pies & Tables */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Traffic & Devices Column */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Traffic Sources */}
                    <Card className="border-border/50 shadow-sm bg-card/40 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Globe className="h-5 w-5 text-primary" />
                                Traffic Sources
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.trafficSource}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {data.trafficSource.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Devices */}
                    <Card className="border-border/50 shadow-sm bg-card/40 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Smartphone className="h-5 w-5 text-primary" />
                                Devices
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.deviceTypeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {data.deviceTypeData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Pages Table */}
                <Card className="lg:col-span-2 border-border/50 shadow-sm bg-card/40 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <MousePointer className="h-5 w-5 text-primary" />
                            Top Pages
                        </CardTitle>
                        <CardDescription>
                            Most visited pages on your store
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.topPages.map((page: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <Badge variant="outline" className="h-6 w-6 flex items-center justify-center rounded-full p-0 shrink-0 border-muted-foreground/30">
                                            {index + 1}
                                        </Badge>
                                        <div className="min-w-0">
                                            <p className="font-medium truncate text-sm">{page.path}</p>
                                            <div className="w-full bg-muted/50 h-1.5 rounded-full mt-1.5 overflow-hidden w-24 sm:w-48">
                                                <div
                                                    className="bg-primary h-full rounded-full"
                                                    style={{ width: `${(page.views / data.topPages[0].views) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-foreground block">{page.views.toLocaleString()}</span>
                                        <span className="text-xs text-muted-foreground">views</span>
                                    </div>
                                </div>
                            ))}
                            {data.topPages.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No page view data available yet.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, trend, trendUp, inverseTrend }: any) {
    const isPositive = inverseTrend ? !trendUp : trendUp;
    return (
        <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-sm">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <div className="bg-background/80 p-2 rounded-lg shadow-sm border border-border/50">
                        {icon}
                    </div>
                </div>
                <div>
                    <h3 className="text-2xl font-bold tracking-tight text-foreground">{value}</h3>
                    <p className={`text-xs mt-1 font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'} flex items-center gap-1`}>
                        {trend}
                        <span className="text-muted-foreground font-normal">from last period</span>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

// Utility to process raw analytics data into chart-friendly format
function processAnalyticsData(rawData: any[], days: number) {
    if (!rawData || rawData.length === 0) return null;

    // 1. Total Visitors (Unique Visitor IDs)
    const uniqueVisitors = new Set(rawData.map(r => r.visitor_id)).size;

    // 2. Metrics
    const totalPageViews = rawData.length;

    // --- Session Analysis ---
    const sessions: Record<string, { events: any[], startTime: number, endTime: number }> = {};
    rawData.forEach(r => {
        if (!r.session_id) return;
        if (!sessions[r.session_id]) {
            sessions[r.session_id] = { events: [], startTime: new Date(r.created_at).getTime(), endTime: new Date(r.created_at).getTime() };
        }
        sessions[r.session_id].events.push(r);

        const timestamp = new Date(r.created_at).getTime();
        if (timestamp < sessions[r.session_id].startTime) sessions[r.session_id].startTime = timestamp;
        if (timestamp > sessions[r.session_id].endTime) sessions[r.session_id].endTime = timestamp;
    });

    let bouncedSessionsCount = 0;
    let totalSessionDurationMs = 0;
    let multiEventSessionsCount = 0;

    const sessionKeys = Object.keys(sessions);
    const totalSessions = sessionKeys.length || 1; // Avoid div by 0

    sessionKeys.forEach(key => {
        const session = sessions[key];
        // 3. Bounce Rate (Sessions with only 1 event OR duration < 10 seconds)
        const durationMs = session.endTime - session.startTime;
        if (session.events.length <= 1 || durationMs < 10000) {
            bouncedSessionsCount++;
        } else {
            // 4. Avg Session Duration
            totalSessionDurationMs += durationMs;
            multiEventSessionsCount++;
        }
    });

    const bounceRate = Math.round((bouncedSessionsCount / totalSessions) * 100);
    const avgSessionDurationSeconds = multiEventSessionsCount > 0
        ? Math.round((totalSessionDurationMs / multiEventSessionsCount) / 1000)
        : 0;

    // Format duration for display (e.g., "1m 45s" or just seconds if < 60)
    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    const avgSessionDurationStr = formatDuration(avgSessionDurationSeconds);

    // 5. Traffic Sources
    const sources: Record<string, number> = {};
    rawData.forEach(r => {
        let source = 'Direct';
        if (r.referrer) {
            try {
                const url = new URL(r.referrer);
                if (url.hostname.includes('google') || url.hostname.includes('bing') || url.hostname.includes('yahoo')) source = 'Organic Search';
                else if (url.hostname.includes('facebook') || url.hostname.includes('instagram') || url.hostname.includes('tiktok') || url.hostname.includes('twitter') || url.hostname.includes('linkedin')) source = 'Social Media';
                else if (url.hostname === location.hostname) source = 'Internal'; // Should filter these out usually, but just in case
                else source = 'Referral';
            } catch {
                source = 'Referral';
            }
        }
        sources[source] = (sources[source] || 0) + 1;
    });

    const trafficSource = Object.entries(sources)
        .filter(([name]) => name !== 'Internal')
        .map(([name, value]) => ({ name, value }));

    // 6. Device Types
    const devices: Record<string, number> = {};
    rawData.forEach(r => {
        const device = r.device_type || 'Unknown';
        devices[device] = (devices[device] || 0) + 1;
    });

    const deviceTypeData = Object.entries(devices).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
    }));

    // 7. Top Pages
    const pages: Record<string, number> = {};
    rawData.forEach(r => {
        const path = r.page_path.split('?')[0] || '/';
        pages[path] = (pages[path] || 0) + 1;
    });

    const topPages = Object.entries(pages)
        .sort(([, a], [, b]) => b as number - (a as number))
        .slice(0, 5)
        .map(([path, views]) => ({ path, views }));

    // 8. Daily Visits
    const dailyVisitsMap: Record<string, number> = {};
    const today = new Date();
    for (let i = days; i >= 0; i--) {
        const d = subDays(today, i);
        dailyVisitsMap[format(d, 'yyyy-MM-dd')] = 0;
    }

    const visitorsByDay: Record<string, Set<string>> = {};
    rawData.forEach(r => {
        const date = format(new Date(r.created_at), 'yyyy-MM-dd');
        if (dailyVisitsMap[date] !== undefined) {
            if (!visitorsByDay[date]) visitorsByDay[date] = new Set();
            if (r.visitor_id) visitorsByDay[date].add(r.visitor_id);
        }
    });

    const dailyVisits = Object.keys(dailyVisitsMap).map(date => ({
        date,
        visitors: visitorsByDay[date] ? visitorsByDay[date].size : 0
    }));

    return {
        totalVisitors: uniqueVisitors,
        totalPageViews,
        bounceRate: isNaN(bounceRate) ? 0 : bounceRate,
        avgSessionDuration: avgSessionDurationStr,
        trafficSource,
        deviceTypeData,
        topPages,
        dailyVisits
    };
}
