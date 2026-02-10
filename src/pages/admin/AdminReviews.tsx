import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
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
            r.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
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
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    <h1 className="text-3xl font-bold">{t.reviews?.adminTitle || "Review Management"}</h1>
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t.common.searchPlaceholder}
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[180px]">
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

                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead className="w-1/3">Comment</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">{t.common.loading}</TableCell>
                                </TableRow>
                            ) : filteredReviews.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No reviews found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredReviews.map((review) => (
                                    <TableRow key={review.id}>
                                        <TableCell className="whitespace-nowrap">
                                            {format(new Date(review.created_at), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{review.user?.full_name || 'Anonymous'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {review.product ? (
                                                <Link to={`/products/${review.product.slug}`} className="flex items-center gap-2 text-primary hover:underline group">
                                                    <span className="truncate max-w-[150px]">{review.product.name}</span>
                                                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </Link>
                                            ) : 'Unknown Product'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex text-warning text-xs">
                                                {Array.from({ length: review.rating }).map((_, i) => (
                                                    <span key={i}>★</span>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {review.comment || <span className="italic text-muted-foreground/50">No comment</span>}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(review.status)}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {review.status === 'pending' && (
                                                <>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50" onClick={() => updateStatus({ id: review.id, status: 'approved' })} title="Approve">
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => updateStatus({ id: review.id, status: 'rejected' })} title="Reject">
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}

                                            {review.status !== 'pending' && (
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => updateStatus({ id: review.id, status: review.status === 'approved' ? 'rejected' : 'approved' })} title="Toggle Status">
                                                    {review.status === 'approved' ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                                </Button>
                                            )}

                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => {
                                                if (confirm('Are you sure you want to delete this review?')) deleteReview(review.id);
                                            }} title="Delete">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </Layout>
    );
}
