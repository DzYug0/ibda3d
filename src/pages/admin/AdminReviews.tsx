import { useState } from 'react';

import { useAdminReviews, useUpdateReviewStatus, useDeleteReview } from '@/hooks/useReviews';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Trash2, Search, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function AdminReviews() {
    const { data: reviews = [], isLoading } = useAdminReviews();
    const { mutate: updateStatus } = useUpdateReviewStatus();
    const { mutate: deleteReview } = useDeleteReview();
    const { t } = useLanguage();

    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [search, setSearch] = useState('');

    const filteredReviews = reviews.filter(r => {
        const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
        const matchesSearch =
            r.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
            r.comment?.toLowerCase().includes(search.toLowerCase()) ||
            r.product?.name?.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge variant="default" className="bg-green-500">{t.reviews?.approve || 'Approved'}</Badge>;
            case 'rejected': return <Badge variant="destructive">{t.reviews?.reject || 'Rejected'}</Badge>;
            default: return <Badge variant="secondary" className="bg-yellow-500 text-white">{t.reviews?.status || 'Pending'}</Badge>;
        }
    };

    return (
        <div className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">{t.reviews?.adminTitle || "Review Management"}</h1>
                    <p className="text-muted-foreground mt-1">Manage customer reviews and ratings</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto bg-card/50 backdrop-blur-sm border border-border/50 p-2 rounded-xl shadow-sm">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t.common.searchPlaceholder}
                            className="pl-9 bg-background/50 border-border/50 focus:bg-background transition-colors"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full sm:w-[180px] bg-background/50 border-border/50">
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-64 skeleton rounded-xl bg-muted/50" />
                    ))}
                </div>
            ) : filteredReviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/50 rounded-xl bg-card/30">
                    <div className="bg-muted/50 p-4 rounded-full mb-4">
                        <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No reviews found</h3>
                    <p className="text-muted-foreground max-w-sm mt-2">
                        {search || filterStatus !== 'all'
                            ? "Try adjusting your search or filters to find what you're looking for."
                            : "No reviews have been submitted yet."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReviews.map((review) => (
                        <div
                            key={review.id}
                            className="group relative bg-card/60 backdrop-blur-md rounded-xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:bg-card/80 flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {(review.user?.username || 'A')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">@{review.user?.username || 'Anonymous'}</p>
                                        <p className="text-xs text-muted-foreground">{format(new Date(review.created_at), 'MMM d, yyyy')}</p>
                                    </div>
                                </div>
                                {getStatusBadge(review.status)}
                            </div>

                            <div className="mb-4 flex-1">
                                <div className="flex mb-2 text-warning">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <span key={i} className={i < review.rating ? "text-amber-400" : "text-muted/30"}>★</span>
                                    ))}
                                </div>

                                {review.product && (
                                    <Link
                                        to={`/products/${review.product.slug}`}
                                        className="text-xs font-medium text-primary hover:underline mb-2 block truncate"
                                    >
                                        {review.product.name}
                                    </Link>
                                )}

                                <p className="text-sm text-muted-foreground line-clamp-4 italic">
                                    "{review.comment || 'No comment provided'}"
                                </p>

                                {review.image_urls && review.image_urls.length > 0 && (
                                    <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                                        {review.image_urls.map((url, index) => (
                                            <a
                                                key={index}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border border-border cursor-pointer hover:opacity-80 transition-opacity"
                                            >
                                                <img src={url} alt={`Review attachment ${index + 1}`} className="h-full w-full object-cover" />
                                                <ExternalLink className="absolute top-1 right-1 h-3 w-3 text-white drop-shadow-md opacity-0 group-hover:opacity-100" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-border/50 flex justify-between items-center mt-auto">
                                <div className="flex gap-2">
                                    {review.status === 'pending' ? (
                                        <>
                                            <Button size="sm" variant="outline" className="h-8 border-green-500/30 text-green-600 hover:bg-green-500/10 hover:text-green-700" onClick={() => updateStatus({ id: review.id, status: 'approved' })}>
                                                <Check className="h-3.5 w-3.5 mr-1" /> Approve
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-8 border-red-500/30 text-red-600 hover:bg-red-500/10 hover:text-red-700" onClick={() => updateStatus({ id: review.id, status: 'rejected' })}>
                                                <X className="h-3.5 w-3.5 mr-1" /> Reject
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                            onClick={() => updateStatus({ id: review.id, status: review.status === 'approved' ? 'rejected' : 'approved' })}
                                        >
                                            Mark as {review.status === 'approved' ? 'Rejected' : 'Approved'}
                                        </Button>
                                    )}
                                </div>

                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                        if (confirm('Are you sure you want to delete this review?')) deleteReview(review.id);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
