import { useState } from 'react';
import { useSubmitReview } from '@/hooks/useReviews';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Link } from 'react-router-dom';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReviewFormProps {
    productId: string;
    onSuccess?: () => void;
}

export function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const { mutate: submitReview, isPending } = useSubmitReview();
    const { user } = useAuth();
    const { t } = useLanguage();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            // Limit to 3 images total
            if (files.length + newFiles.length > 3) {
                toast.error("You can only upload up to 3 images.");
                return;
            }
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadImages = async (): Promise<string[]> => {
        if (files.length === 0) return [];
        setIsUploading(true);
        const urls: string[] = [];

        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                const filePath = `${user?.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('review-images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('review-images')
                    .getPublicUrl(filePath);

                urls.push(publicUrl);
            }
        } catch (error: any) {
            console.error('Error uploading images:', error);
            toast.error(`Failed to upload images: ${error.message || 'Unknown error'}`);
            throw error; // Stop submission
        } finally {
            setIsUploading(false);
        }

        return urls;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;

        try {
            const imageUrls = await uploadImages();

            submitReview({ productId, rating, comment, imageUrls }, {
                onSuccess: () => {
                    setRating(0);
                    setComment('');
                    setFiles([]);
                    onSuccess?.();
                }
            });
        } catch (error) {
            // Error handled in uploadImages
        }
    };

    if (!user) {
        return (
            <div className="bg-muted/30 p-6 rounded-xl text-center border border-dashed border-border">
                <p className="text-muted-foreground mb-4">{t.reviews?.loginToReview || "Please log in to leave a review."}</p>
                <Link to="/auth">
                    <Button variant="outline">{t.auth.signInBtn}</Button>
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-xl border border-border">
            <h3 className="font-semibold text-lg">{t.reviews?.writeReview || "Write a Review"}</h3>

            <div className="space-y-2">
                <Label>{t.reviews?.rating || "Rating"}</Label>
                <StarRating
                    rating={rating}
                    max={5}
                    size={24}
                    interactive
                    onRatingChange={setRating}
                />
                {rating === 0 && <p className="text-xs text-muted-foreground animate-pulse">Select stars to rate</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="comment">{t.reviews?.comment || "Comment"}</Label>
                <Textarea
                    id="comment"
                    placeholder={t.reviews?.commentPlaceholder || "Share your experience..."}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px]"
                />
            </div>

            <div className="space-y-2">
                <Label>Photos (Optional, max 3)</Label>
                <div className="flex flex-wrap gap-4">
                    {files.map((file, index) => (
                        <div key={index} className="relative w-20 h-20 border rounded-md overflow-hidden group">
                            <img
                                src={URL.createObjectURL(file)}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute top-0 right-0 p-1 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    {files.length < 3 && (
                        <label className="w-20 h-20 border border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                            <ImagePlus className="w-6 h-6 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground mt-1">Add Photo</span>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                            />
                        </label>
                    )}
                </div>
            </div>

            <Button type="submit" disabled={isPending || isUploading || rating === 0}>
                {(isPending || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending || isUploading ? ("Submitting...") : (t.reviews?.submit || "Submit Review")}
            </Button>
        </form>
    );
}
